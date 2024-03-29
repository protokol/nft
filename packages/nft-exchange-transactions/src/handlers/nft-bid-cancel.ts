import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Enums, Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

import {
    NFTExchangeBidCancelAuctionCanceledOrAccepted,
    NFTExchangeBidCancelBidCanceled,
    NFTExchangeBidCancelBidDoesNotExists,
    NFTExchangeBidCancelCannotCancelOtherBids,
} from "../errors";
import { NFTExchangeApplicationEvents } from "../events";
import { INFTAuctions } from "../interfaces";
import { NFTExchangeIndexers } from "../wallet-indexes";
import { NFTBidHandler } from "./nft-bid";
import { NFTExchangeTransactionHandler } from "./nft-exchange-handler";

@Container.injectable()
export class NFTBidCancelHandler extends NFTExchangeTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

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
        for await (const transaction of this.transactionHistoryService.streamByCriteria(this.getDefaultCriteria())) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<NFTInterfaces.NFTBidCancelAsset>(transaction.asset?.nftBidCancel);

            const cancelBidAsset: NFTInterfaces.NFTBidCancelAsset = transaction.asset.nftBidCancel;
            const bidTransaction = await this.transactionRepository.findById(cancelBidAsset.bidId);
            const wallet = this.walletRepository.findByPublicKey(bidTransaction.senderPublicKey);
            const bidAmount: Utils.BigNumber = bidTransaction.asset.nftBid.bidAmount;

            wallet.setBalance(wallet.getBalance().plus(bidAmount));

            const lockedBalance = wallet.getAttribute<Utils.BigNumber>(
                "nft.exchange.lockedBalance",
                Utils.BigNumber.ZERO,
            );
            wallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", lockedBalance.minus(bidAmount));

            const auctionTransaction = await this.transactionRepository.findById(bidTransaction.asset.nftBid.auctionId);
            const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

            const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
            auctionWalletAsset[auctionTransaction.id]!.bids = auctionWalletAsset[auctionTransaction.id]!.bids.filter(
                (bid) => bid !== cancelBidAsset.bidId,
            );
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

            this.walletRepository.forgetOnIndex(NFTExchangeIndexers.BidIndexer, cancelBidAsset.bidId);
            await this.emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTCancelBid, transaction);
        }
    }

    public override async emitEvents(
        transaction: Interfaces.ITransaction,
        emitter: Contracts.Kernel.EventDispatcher,
    ): Promise<void> {
        await emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTCancelBid, transaction.data);
    }

    public override async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTBidCancelAsset>(transaction.data.asset?.nftBidCancel);
        const nftBidCancelAsset = transaction.data.asset.nftBidCancel;

        const bidTransaction = await this.transactionRepository.findById(nftBidCancelAsset.bidId);
        if (
            !bidTransaction ||
            bidTransaction.typeGroup !== Enums.NFTExchangeTransactionsTypeGroup ||
            bidTransaction.type !== Enums.NFTTransactionTypes.NFTBid
        ) {
            throw new NFTExchangeBidCancelBidDoesNotExists();
        }

        if (sender.getPublicKey() !== bidTransaction.senderPublicKey) {
            throw new NFTExchangeBidCancelCannotCancelOtherBids();
        }

        const auctionTransaction = await this.transactionRepository.findById(bidTransaction.asset.nftBid.auctionId);

        const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);
        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        if (!auctionWalletAsset[auctionTransaction.id]) {
            throw new NFTExchangeBidCancelAuctionCanceledOrAccepted();
        }
        if (!auctionWalletAsset[auctionTransaction.id]!.bids.some((bid) => bid === nftBidCancelAsset.bidId)) {
            throw new NFTExchangeBidCancelBidCanceled();
        }

        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public override async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const bidId: string = transaction.data.asset!.nftBidCancel.bidId;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset!.nftBidCancel.bidId === bidId)
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT Bid Cancel, bid cancel for ${bidId} bid already in pool`,
                "ERR_PENDING",
            );
        }
    }

    public override async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);
        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTInterfaces.NFTBidCancelAsset>(transaction.data.asset?.nftBidCancel);

        const cancelBidAsset: NFTInterfaces.NFTBidCancelAsset = transaction.data.asset!.nftBidCancel;

        const bidTransaction = await this.transactionRepository.findById(cancelBidAsset.bidId);
        const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(bidTransaction.senderPublicKey);
        const bidAmount: Utils.BigNumber = bidTransaction.asset.nftBid.bidAmount;

        wallet.setBalance(wallet.getBalance().plus(bidAmount));

        const lockedBalance = wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.ZERO);
        wallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", lockedBalance.minus(bidAmount));

        const auctionTransaction = await this.transactionRepository.findById(bidTransaction.asset.nftBid.auctionId);
        const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletAsset[auctionTransaction.id]!.bids = auctionWalletAsset[auctionTransaction.id]!.bids.filter(
            (bid) => bid !== cancelBidAsset.bidId,
        );
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        this.walletRepository.forgetOnIndex(NFTExchangeIndexers.BidIndexer, cancelBidAsset.bidId);
    }

    public override async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);
        AppUtils.assert.defined<NFTInterfaces.NFTBidCancelAsset>(transaction.data.asset?.nftBidCancel);

        const cancelBidAsset: NFTInterfaces.NFTBidCancelAsset = transaction.data.asset.nftBidCancel;

        const bidTransaction = await this.transactionRepository.findById(cancelBidAsset.bidId);
        const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(bidTransaction.senderPublicKey);
        const bidAmount: Utils.BigNumber = bidTransaction.asset.nftBid.bidAmount;

        wallet.setBalance(wallet.getBalance().minus(bidAmount));

        const lockedBalance = wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.ZERO);
        wallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", lockedBalance.plus(bidAmount));

        const auctionTransaction = await this.transactionRepository.findById(bidTransaction.asset.nftBid.auctionId);
        const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletAsset[auctionTransaction.id]!.bids.push(cancelBidAsset.bidId);
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        this.walletRepository.setOnIndex(NFTExchangeIndexers.BidIndexer, cancelBidAsset.bidId, auctionWallet);
        await this.emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTCancelBidRevert, transaction.data);
    }
}
