import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Enums, Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

import {
    NFTExchangeBidAuctionCanceledOrAccepted,
    NFTExchangeBidAuctionDoesNotExists,
    NFTExchangeBidAuctionExpired,
    NFTExchangeBidCannotBidOwnItem,
    NFTExchangeBidNotEnoughFounds,
    NFTExchangeBidStartAmountToLow,
} from "../errors";
import { NFTExchangeApplicationEvents } from "../events";
import { INFTAuctions } from "../interfaces";
import { NFTExchangeIndexers } from "../wallet-indexes";
import { NFTAuctionHandler } from "./nft-auction";
import { NFTExchangeTransactionHandler } from "./nft-exchange-handler";

@Container.injectable()
export class NFTBidHandler extends NFTExchangeTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTBidTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NFTAuctionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["nft.exchange.lockedBalance"];
    }

    public async bootstrap(): Promise<void> {
        for await (const transaction of this.transactionHistoryService.streamByCriteria(this.getDefaultCriteria())) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<NFTInterfaces.NFTBidAsset>(transaction.asset?.nftBid);
            AppUtils.assert.defined<string>(transaction.id);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const nftBidAsset: NFTInterfaces.NFTBidAsset = transaction.asset.nftBid;

            wallet.setBalance(wallet.getBalance().minus(nftBidAsset.bidAmount));

            const lockedBalance = wallet.getAttribute<Utils.BigNumber>(
                "nft.exchange.lockedBalance",
                Utils.BigNumber.ZERO,
            );
            wallet.setAttribute<Utils.BigNumber>(
                "nft.exchange.lockedBalance",
                lockedBalance.plus(nftBidAsset.bidAmount),
            );

            const auctionTransaction: Models.Transaction = await this.transactionRepository.findById(
                nftBidAsset.auctionId,
            );
            const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

            const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
            auctionWalletAsset[nftBidAsset.auctionId]!.bids.push(transaction.id);
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

            this.walletRepository.setOnIndex(NFTExchangeIndexers.BidIndexer, transaction.id, auctionWallet);
            await this.emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTBid, transaction);
        }
    }

    public async emitEvents(
        transaction: Interfaces.ITransaction,
        emitter: Contracts.Kernel.EventDispatcher,
    ): Promise<void> {
        await emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTBid, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTBidAsset>(transaction.data.asset?.nftBid);
        const nftBid: NFTInterfaces.NFTBidAsset = transaction.data.asset.nftBid;

        const auctionTransaction = await this.transactionRepository.findById(nftBid.auctionId);
        if (
            !auctionTransaction ||
            auctionTransaction.typeGroup !== Enums.NFTExchangeTransactionsTypeGroup ||
            auctionTransaction.type !== Enums.NFTTransactionTypes.NFTAuction
        ) {
            throw new NFTExchangeBidAuctionDoesNotExists();
        }

        const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);
        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        if (!auctionWalletAsset[auctionTransaction.id]) {
            throw new NFTExchangeBidAuctionCanceledOrAccepted();
        }

        this.checkBiddingOnOwnAuction(auctionWallet, sender);

        const lastBlock: Interfaces.IBlock = this.app.get<any>(Container.Identifiers.StateStore).getLastBlock();
        if (lastBlock.data.height >= auctionTransaction.asset.nftAuction.expiration.blockHeight) {
            throw new NFTExchangeBidAuctionExpired();
        }

        if (sender.getBalance().isLessThan(nftBid.bidAmount)) {
            throw new NFTExchangeBidNotEnoughFounds();
        }

        const nftAuctionAsset: NFTInterfaces.NFTAuctionAsset = auctionTransaction.asset.nftAuction;
        if (Utils.BigNumber.make(nftAuctionAsset.startAmount).isGreaterThan(nftBid.bidAmount)) {
            throw new NFTExchangeBidStartAmountToLow();
        }

        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTInterfaces.NFTBidAsset>(transaction.data.asset?.nftBid);
        AppUtils.assert.defined<string>(transaction.data.id);

        const nftBidAsset: NFTInterfaces.NFTBidAsset = transaction.data.asset!.nftBid;

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        sender.setBalance(sender.getBalance().minus(nftBidAsset.bidAmount));

        const lockedBalance = sender.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.ZERO);
        sender.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", lockedBalance.plus(nftBidAsset.bidAmount));

        const auctionTransaction: Models.Transaction = await this.transactionRepository.findById(nftBidAsset.auctionId);

        const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletAsset[nftBidAsset.auctionId]!.bids.push(transaction.data.id);
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        this.walletRepository.setOnIndex(NFTExchangeIndexers.BidIndexer, transaction.data.id, auctionWallet);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTBidAsset>(transaction.data.asset?.nftBid);
        AppUtils.assert.defined<string>(transaction.data.id);

        const nftBidAsset: NFTInterfaces.NFTBidAsset = transaction.data.asset.nftBid;

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        sender.setBalance(sender.getBalance().plus(nftBidAsset.bidAmount));

        const lockedBalance = sender.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.ZERO);
        sender.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", lockedBalance.minus(nftBidAsset.bidAmount));

        const auctionTransaction: Models.Transaction = await this.transactionRepository.findById(nftBidAsset.auctionId);

        const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletAsset[nftBidAsset.auctionId]!.bids = auctionWalletAsset[nftBidAsset.auctionId]!.bids.filter(
            (bid) => bid !== transaction.data.id,
        );
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        this.walletRepository.forgetOnIndex(NFTExchangeIndexers.BidIndexer, transaction.data.id);
        await this.emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTBidRevert, transaction.data);
    }

    private checkBiddingOnOwnAuction(auctionWallet: Contracts.State.Wallet, bidWallet: Contracts.State.Wallet): void {
        if (auctionWallet.getPublicKey() === bidWallet.getPublicKey()) {
            throw new NFTExchangeBidCannotBidOwnItem();
        }
    }
}
