import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";
import { Enums as NFTExchangeEnums } from "@protokol/nft-exchange-crypto";

import { NFTExchangeAuctionCancelCannotCancel } from "../errors";
import { NFTExchangeApplicationEvents } from "../events";
import { INFTAuctions } from "../interfaces";
import { NFTExchangeIndexers } from "../wallet-indexes";
import { NFTAuctionHandler } from "./nft-auction";
import { NFTExchangeHandler } from "./nft-exchange-handler";

@Container.injectable()
export class NFTAuctionCancelHandler extends NFTExchangeHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTAuctionCancelTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NFTAuctionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const nftAuctionCancelAsset: NFTInterfaces.NFTAuctionCancel = transaction.asset.nftAuctionCancel;
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const auctionsWalletAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions");

            for (const bid of auctionsWalletAsset[nftAuctionCancelAsset.auctionId].bids) {
                const bidTransaction: Models.Transaction = await this.transactionRepository.findById(bid);
                const bidWallet = this.walletRepository.findByPublicKey(bidTransaction.senderPublicKey);
                bidWallet.balance = bidWallet.balance.plus(bidTransaction.asset.nftBid.bidAmount);
                this.walletRepository.forgetByIndex(NFTExchangeIndexers.BidIndexer, bidTransaction.id);
                this.walletRepository.index(bidWallet);
            }

            delete auctionsWalletAsset[nftAuctionCancelAsset.auctionId];
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

            this.walletRepository.forgetByIndex(NFTExchangeIndexers.AuctionIndexer, nftAuctionCancelAsset.auctionId);
            this.walletRepository.index(wallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTExchangeApplicationEvents.NFTCancelAuction, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTAuctionCancel>(transaction.data.asset?.nftAuctionCancel);
        const nftAuctionCancel: NFTInterfaces.NFTAuctionCancel = transaction.data.asset.nftAuctionCancel;

        if (!sender.hasAttribute("nft.exchange.auctions")) {
            throw new NFTExchangeAuctionCancelCannotCancel();
        }

        const nftExchangeWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions");

        if (!nftExchangeWalletAsset[nftAuctionCancel.auctionId]) {
            throw new NFTExchangeAuctionCancelCannotCancel();
        }

        return super.throwIfCannotBeApplied(transaction, sender, customWalletRepository);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const auctionId: string = transaction.data.asset!.nftAuctionCancel.auctionId;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset?.nftAuctionCancel.auctionId === auctionId)
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT Auction Cancel, auction cancel for ${auctionId} auction already in pool`,
                "ERR_PENDING",
                transaction,
            );
        }
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, customWalletRepository);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTAuctionCancel>(transaction.data.asset?.nftAuctionCancel);
        const nftAuctionCancelAsset: NFTInterfaces.NFTAuctionCancel = transaction.data.asset.nftAuctionCancel;

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions");

        for (const bid of auctionsWalletAsset[nftAuctionCancelAsset.auctionId].bids) {
            const bidTransaction: Models.Transaction = await this.transactionRepository.findById(bid);
            const bidWallet = walletRepository.findByPublicKey(bidTransaction.senderPublicKey);
            bidWallet.balance = bidWallet.balance.plus(bidTransaction.asset.nftBid.bidAmount);
            walletRepository.forgetByIndex(NFTExchangeIndexers.BidIndexer, bidTransaction.id);
            walletRepository.index(bidWallet);
        }

        delete auctionsWalletAsset[nftAuctionCancelAsset.auctionId];
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

        walletRepository.forgetByIndex(NFTExchangeIndexers.AuctionIndexer, nftAuctionCancelAsset.auctionId);
        walletRepository.index(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTAuctionCancel>(transaction.data.asset?.nftAuctionCancel);
        const nftAuctionCancelAsset = transaction.data.asset.nftAuctionCancel;

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const nftAuctionTransaction: Models.Transaction = await this.transactionRepository.findById(
            nftAuctionCancelAsset.auctionId,
        );

        const bidTransactions = await this.transactionHistoryService.findManyByCriteria({
            typeGroup: NFTExchangeEnums.NFTExchangeTransactionsTypeGroup,
            type: NFTExchangeEnums.NFTTransactionTypes.NFTBid,
            asset: { nftBid: { auctionId: nftAuctionCancelAsset.auctionId } },
        });
        const activeBids: string[] = [];
        if (bidTransactions) {
            for (const bidTransaction of bidTransactions) {
                const bidCancel = await this.transactionHistoryService.findOneByCriteria({
                    typeGroup: NFTExchangeEnums.NFTExchangeTransactionsTypeGroup,
                    type: NFTExchangeEnums.NFTTransactionTypes.NFTBidCancel,
                    asset: { nftBidCancel: { bidId: bidTransaction.id } },
                });
                if (!bidCancel) {
                    // @ts-ignore
                    activeBids.push(bidTransaction.id);
                }
            }
        }

        for (const bid of activeBids) {
            const bidTransaction: Models.Transaction = await this.transactionRepository.findById(bid);
            const bidWallet = walletRepository.findByPublicKey(bidTransaction.senderPublicKey);
            bidWallet.balance = bidWallet.balance.minus(bidTransaction.asset.nftBid.bidAmount);
            walletRepository.index(bidWallet);
        }

        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
        auctionsWalletAsset[nftAuctionCancelAsset.auctionId] = {
            nftIds: nftAuctionTransaction.asset.nftAuction.nftIds,
            bids: activeBids,
        };
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);
        walletRepository.index(sender);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
