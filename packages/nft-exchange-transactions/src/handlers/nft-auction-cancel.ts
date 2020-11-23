import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";
import { Enums as NFTExchangeEnums } from "@protokol/nft-exchange-crypto";

import { NFTExchangeAuctionCancelCannotCancel } from "../errors";
import { NFTExchangeApplicationEvents } from "../events";
import { INFTAuctions } from "../interfaces";
import { NFTExchangeIndexers } from "../wallet-indexes";
import { NFTAuctionHandler } from "./nft-auction";
import { NFTExchangeTransactionHandler } from "./nft-exchange-handler";

@Container.injectable()
export class NFTAuctionCancelHandler extends NFTExchangeTransactionHandler {
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
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<NFTInterfaces.NFTAuctionCancel>(transaction.asset?.nftAuctionCancel);

            const nftAuctionCancelAsset: NFTInterfaces.NFTAuctionCancel = transaction.asset.nftAuctionCancel;
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const auctionsWalletAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions");

            const bidTransactions = await this.transactionRepository.findByIds(
                auctionsWalletAsset[nftAuctionCancelAsset.auctionId]!.bids,
            );

            for (const bid of bidTransactions) {
                const bidWallet = this.walletRepository.findByPublicKey(bid.senderPublicKey);
                const bidAmount: Utils.BigNumber = bid.asset.nftBid.bidAmount;

                bidWallet.balance = bidWallet.balance.plus(bidAmount);
                const lockedBalance = bidWallet.getAttribute<Utils.BigNumber>(
                    "nft.exchange.lockedBalance",
                    Utils.BigNumber.ZERO,
                );
                bidWallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", lockedBalance.minus(bidAmount));

                this.walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).forget(bid.id);
            }

            delete auctionsWalletAsset[nftAuctionCancelAsset.auctionId];
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

            this.walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).forget(nftAuctionCancelAsset.auctionId);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTExchangeApplicationEvents.NFTCancelAuction, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
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

        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const auctionId: string = transaction.data.asset!.nftAuctionCancel.auctionId;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset!.nftAuctionCancel.auctionId === auctionId)
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT Auction Cancel, auction cancel for ${auctionId} auction already in pool`,
                "ERR_PENDING",
            );
        }
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTInterfaces.NFTAuctionCancel>(transaction.data.asset?.nftAuctionCancel);
        const nftAuctionCancelAsset: NFTInterfaces.NFTAuctionCancel = transaction.data.asset!.nftAuctionCancel;

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions");

        const bidTransactions = await this.transactionRepository.findByIds(
            auctionsWalletAsset[nftAuctionCancelAsset.auctionId]!.bids,
        );

        for (const bid of bidTransactions) {
            const bidWallet = this.walletRepository.findByPublicKey(bid.senderPublicKey);
            const bidAmount: Utils.BigNumber = bid.asset.nftBid.bidAmount;

            bidWallet.balance = bidWallet.balance.plus(bidAmount);
            const lockedBalance = bidWallet.getAttribute<Utils.BigNumber>(
                "nft.exchange.lockedBalance",
                Utils.BigNumber.ZERO,
            );
            bidWallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", lockedBalance.minus(bidAmount));

            this.walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).forget(bid.id);
        }

        delete auctionsWalletAsset[nftAuctionCancelAsset.auctionId];
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

        this.walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).forget(nftAuctionCancelAsset.auctionId);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTAuctionCancel>(transaction.data.asset?.nftAuctionCancel);
        const nftAuctionCancelAsset = transaction.data.asset.nftAuctionCancel;

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const nftAuctionTransaction: Models.Transaction = await this.transactionRepository.findById(
            nftAuctionCancelAsset.auctionId,
        );

        const bidTransactions = await this.transactionHistoryService.findManyByCriteria({
            typeGroup: NFTExchangeEnums.NFTExchangeTransactionsTypeGroup,
            type: NFTExchangeEnums.NFTTransactionTypes.NFTBid,
            asset: { nftBid: { auctionId: nftAuctionCancelAsset.auctionId } },
        });
        const activeBids: string[] = [];
        for (const bidTransaction of bidTransactions) {
            const bidCancel = await this.transactionHistoryService.findOneByCriteria({
                typeGroup: NFTExchangeEnums.NFTExchangeTransactionsTypeGroup,
                type: NFTExchangeEnums.NFTTransactionTypes.NFTBidCancel,
                asset: { nftBidCancel: { bidId: bidTransaction.id } },
            });
            if (!bidCancel) {
                activeBids.push(bidTransaction.id!);
            }
        }

        for (const bid of activeBids) {
            const bidTransaction: Models.Transaction = await this.transactionRepository.findById(bid);
            const bidWallet = this.walletRepository.findByPublicKey(bidTransaction.senderPublicKey);
            const bidAmount: Utils.BigNumber = bidTransaction.asset.nftBid.bidAmount;

            bidWallet.balance = bidWallet.balance.minus(bidAmount);
            const lockedBalance = bidWallet.getAttribute<Utils.BigNumber>(
                "nft.exchange.lockedBalance",
                Utils.BigNumber.ZERO,
            );
            bidWallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", lockedBalance.plus(bidAmount));
        }

        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
        auctionsWalletAsset[nftAuctionCancelAsset.auctionId] = {
            nftIds: nftAuctionTransaction.asset.nftAuction.nftIds,
            bids: activeBids,
        };
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

        this.walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).set(nftAuctionCancelAsset.auctionId, sender);

        for (const bidId of auctionsWalletAsset[nftAuctionCancelAsset.auctionId]!.bids) {
            this.walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).set(bidId, sender);
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
