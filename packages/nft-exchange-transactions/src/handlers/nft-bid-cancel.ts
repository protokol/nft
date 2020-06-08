import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Enums, Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

import {
    NFTExchangeBidCancelAuctionCanceledOrAccepted,
    NFTExchangeBidCancelBidCanceled,
    NFTExchangeBidCancelBidDoesNotExists,
} from "../errors";
import { NFTExchangeApplicationEvents } from "../events";
import { INFTAuctions } from "../interfaces";
import { NFTExchangeIndexers } from "../wallet-indexes";
import { NFTBidHandler } from "./nft-bid";
import { NFTExchangeTransactionHandler } from "./nft-exchange-handler";

@Container.injectable()
export class NFTBidCancelHandler extends NFTExchangeTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTBidCancelTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NFTBidHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const cancelBidAsset: NFTInterfaces.NFTBidCancelAsset = transaction.asset.nftBidCancel;
            const bidTransaction = await this.transactionRepository.findById(cancelBidAsset.bidId);
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                bidTransaction.senderPublicKey,
            );
            wallet.balance = wallet.balance.plus(bidTransaction.asset.nftBid.bidAmount);

            const auctionTransaction = await this.transactionRepository.findById(bidTransaction.asset.nftBid.auctionId);
            const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

            const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
            auctionWalletAsset[auctionTransaction.id].bids = auctionWalletAsset[auctionTransaction.id].bids.filter(
                (bid) => bid !== cancelBidAsset.bidId,
            );
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

            this.walletRepository.forgetByIndex(NFTExchangeIndexers.BidIndexer, cancelBidAsset.bidId);
            this.walletRepository.index(auctionWallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTExchangeApplicationEvents.NFTCancelBid, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTBidCancelAsset>(transaction.data.asset?.nftBidCancel);
        const nftBidCancelAsset = transaction.data.asset?.nftBidCancel;

        const bidTransaction = await this.transactionRepository.findById(nftBidCancelAsset.bidId);
        if (
            !bidTransaction ||
            bidTransaction.typeGroup !== Enums.NFTExchangeTransactionsTypeGroup ||
            bidTransaction.type !== Enums.NFTTransactionTypes.NFTBid
        ) {
            throw new NFTExchangeBidCancelBidDoesNotExists();
        }

        const auctionTransaction = await this.transactionRepository.findById(bidTransaction.asset.nftBid.auctionId);

        const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);
        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        if (!auctionWalletAsset[auctionTransaction.id]) {
            throw new NFTExchangeBidCancelAuctionCanceledOrAccepted();
        }
        if (!auctionWalletAsset[auctionTransaction.id].bids.some((bid) => bid === nftBidCancelAsset.bidId)) {
            throw new NFTExchangeBidCancelBidCanceled();
        }

        return super.throwIfCannotBeApplied(transaction, sender, customWalletRepository);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const bidId: string = transaction.data.asset!.nftBidCancel.bidId;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset?.nftBidCancel.bidId === bidId)
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT Bid Cancel, bid cancel for ${bidId} bid already in pool`,
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
        AppUtils.assert.defined<NFTInterfaces.NFTBidCancelAsset>(transaction.data.asset?.nftBidCancel);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const cancelBidAsset: NFTInterfaces.NFTBidCancelAsset = transaction.data.asset.nftBidCancel;

        const bidTransaction = await this.transactionRepository.findById(cancelBidAsset.bidId);
        const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(bidTransaction.senderPublicKey);
        wallet.balance = wallet.balance.plus(bidTransaction.asset.nftBid.bidAmount);

        const auctionTransaction = await this.transactionRepository.findById(bidTransaction.asset.nftBid.auctionId);
        const auctionWallet = walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletAsset[auctionTransaction.id].bids = auctionWalletAsset[auctionTransaction.id].bids.filter(
            (bid) => bid !== cancelBidAsset.bidId,
        );
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        walletRepository.forgetByIndex(NFTExchangeIndexers.BidIndexer, cancelBidAsset.bidId);
        walletRepository.index(auctionWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);
        AppUtils.assert.defined<NFTInterfaces.NFTBidCancelAsset>(transaction.data.asset?.nftBidCancel);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const cancelBidAsset: NFTInterfaces.NFTBidCancelAsset = transaction.data.asset.nftBidCancel;

        const bidTransaction = await this.transactionRepository.findById(cancelBidAsset.bidId);
        const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(bidTransaction.senderPublicKey);
        wallet.balance = wallet.balance.minus(bidTransaction.asset.nftBid.bidAmount);

        const auctionTransaction = await this.transactionRepository.findById(bidTransaction.asset.nftBid.auctionId);
        const auctionWallet = walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletAsset[auctionTransaction.id].bids.push(cancelBidAsset.bidId);
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        walletRepository.index(auctionWallet);
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
