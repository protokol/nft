import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Indexers as NFTBaseIndexers, Interfaces as NFTBaseInterfaces } from "@protokol/nft-base-transactions";
import { Enums, Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

import {
    NFTExchangeAcceptTradeAuctionCanceled,
    NFTExchangeAcceptTradeAuctionDoesNotExists,
    NFTExchangeAcceptTradeBidCanceled,
    NFTExchangeAcceptTradeBidDoesNotExists,
    NFTExchangeAcceptTradeWalletCannotTrade,
} from "../errors";
import { NFTExchangeApplicationEvents } from "../events";
import { INFTAuctions } from "../interfaces";
import { NFTExchangeIndexers } from "../wallet-indexes";
import { NFTAuctionHandler } from "./nft-auction";
import { NFTBidHandler } from "./nft-bid";
import { NFTExchangeTransactionHandler } from "./nft-exchange-handler";

@Container.injectable()
export class NFTAcceptTradeHandler extends NFTExchangeTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTAcceptTradeTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NFTAuctionHandler, NFTBidHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(): Promise<void> {
        for await (const transaction of this.transactionHistoryService.streamByCriteria(this.getDefaultCriteria())) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<NFTInterfaces.NFTAcceptTradeAsset>(transaction.asset?.nftAcceptTrade);

            const auctionId = transaction.asset.nftAcceptTrade.auctionId;
            const bidId = transaction.asset.nftAcceptTrade.bidId;

            const auctionTransaction = await this.transactionRepository.findById(auctionId);
            const bidTransaction = await this.transactionRepository.findById(bidId);

            const auctionWallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const bidWallet = this.walletRepository.findByPublicKey(bidTransaction.senderPublicKey);

            const nftIds = auctionTransaction.asset.nftAuction.nftIds;

            const auctionWalletBaseAsset =
                auctionWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds");
            for (const nft of nftIds) {
                delete auctionWalletBaseAsset[nft];
                this.walletRepository.forgetOnIndex(NFTBaseIndexers.NFTIndexers.NFTTokenIndexer, nft);
            }
            auctionWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", auctionWalletBaseAsset);

            const bidWalletBaseAsset = bidWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            for (const nft of nftIds) {
                bidWalletBaseAsset[nft] = {};
                this.walletRepository.setOnIndex(NFTBaseIndexers.NFTIndexers.NFTTokenIndexer, nft, bidWallet);
            }
            bidWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", bidWalletBaseAsset);

            const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
            const bidTransactions = await this.transactionRepository.findByIds(auctionWalletAsset[auctionId]!.bids);

            for (const bid of bidTransactions) {
                const bidAmount = bid.asset.nftBid.bidAmount;
                const currentBidWallet = this.walletRepository.findByPublicKey(bid.senderPublicKey);
                if (bid.id !== bidId) {
                    currentBidWallet.setBalance(currentBidWallet.getBalance().plus(bidAmount));
                }
                const lockedBalance = currentBidWallet.getAttribute<Utils.BigNumber>(
                    "nft.exchange.lockedBalance",
                    Utils.BigNumber.ZERO,
                );
                currentBidWallet.setAttribute<Utils.BigNumber>(
                    "nft.exchange.lockedBalance",
                    lockedBalance.minus(bidAmount),
                );
                this.walletRepository.forgetOnIndex(NFTExchangeIndexers.BidIndexer, bid.id);
            }

            auctionWallet.setBalance(auctionWallet.getBalance().plus(bidTransaction.asset.nftBid.bidAmount));

            delete auctionWalletAsset[auctionId];
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

            this.walletRepository.forgetOnIndex(NFTExchangeIndexers.AuctionIndexer, auctionTransaction.id);
            await this.emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTAcceptTrade, transaction);
        }
    }

    public override async emitEvents(
        transaction: Interfaces.ITransaction,
        emitter: Contracts.Kernel.EventDispatcher,
    ): Promise<void> {
        await emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTAcceptTrade, transaction.data);
    }

    public override async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTAcceptTradeAsset>(transaction.data.asset?.nftAcceptTrade);

        if (!sender.hasAttribute("nft.exchange.auctions")) {
            throw new NFTExchangeAcceptTradeWalletCannotTrade();
        }
        const bidId = transaction.data.asset.nftAcceptTrade.bidId;
        const auctionId = transaction.data.asset.nftAcceptTrade.auctionId;

        const bidTransaction = await this.transactionRepository.findById(bidId);
        if (
            !bidTransaction ||
            bidTransaction.typeGroup !== Enums.NFTExchangeTransactionsTypeGroup ||
            bidTransaction.type !== Enums.NFTTransactionTypes.NFTBid
        ) {
            throw new NFTExchangeAcceptTradeBidDoesNotExists();
        }

        const auctionTransaction = await this.transactionRepository.findById(auctionId);
        if (
            !auctionTransaction ||
            auctionTransaction.typeGroup !== Enums.NFTExchangeTransactionsTypeGroup ||
            auctionTransaction.type !== Enums.NFTTransactionTypes.NFTAuction
        ) {
            throw new NFTExchangeAcceptTradeAuctionDoesNotExists();
        }

        const auctionWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions");
        if (!auctionWalletAsset[auctionId]) {
            throw new NFTExchangeAcceptTradeAuctionCanceled();
        }

        if (!auctionWalletAsset[auctionId]!.bids.some((bid) => bid === bidId)) {
            throw new NFTExchangeAcceptTradeBidCanceled();
        }
        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public override async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const auctionId: string = transaction.data.asset!.nftAcceptTrade.auctionId;
        const bidId: string = transaction.data.asset!.nftAcceptTrade.bidId;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset!.nftAcceptTrade.auctionId === auctionId)
            .wherePredicate((t) => t.data.asset!.nftAcceptTrade.bidId === bidId)
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT Accept Trade, Accept Trade for auction ${auctionId} and bid ${bidId} already in pool`,
                "ERR_PENDING",
            );
        }
    }

    public override async apply(transaction: Interfaces.ITransaction): Promise<void> {
        await super.apply(transaction);
        // Line is already checked inside throwIfCannotBeApplied run by super.apply method
        //AppUtils.assert.defined<NFTInterfaces.NFTAcceptTradeAsset>(transaction.data.asset?.nftAcceptTrade);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const auctionId = transaction.data.asset!.nftAcceptTrade.auctionId;
        const bidId = transaction.data.asset!.nftAcceptTrade.bidId;

        const auctionTransaction = await this.transactionRepository.findById(auctionId);
        const bidTransaction = await this.transactionRepository.findById(bidId);

        const auctionWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const bidWallet = this.walletRepository.findByPublicKey(bidTransaction.senderPublicKey);

        const nftIds = auctionTransaction.asset.nftAuction.nftIds;

        const auctionWalletBaseAsset = auctionWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds");
        for (const nft of nftIds) {
            delete auctionWalletBaseAsset[nft];
            this.walletRepository.forgetOnIndex(NFTBaseIndexers.NFTIndexers.NFTTokenIndexer, nft);
        }
        auctionWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", auctionWalletBaseAsset);

        const bidWalletBaseAsset = bidWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
        for (const nft of nftIds) {
            bidWalletBaseAsset[nft] = {};
            this.walletRepository.setOnIndex(NFTBaseIndexers.NFTIndexers.NFTTokenIndexer, nft, bidWallet);
        }
        bidWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", bidWalletBaseAsset);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        const bidTransactions = await this.transactionRepository.findByIds(auctionWalletAsset[auctionId]!.bids);

        for (const bid of bidTransactions) {
            const bidAmount = bid.asset.nftBid.bidAmount;
            const currentBidWallet = this.walletRepository.findByPublicKey(bid.senderPublicKey);
            if (bid.id !== bidId) {
                currentBidWallet.setBalance(currentBidWallet.getBalance().plus(bidAmount));
            }
            const lockedBalance = currentBidWallet.getAttribute<Utils.BigNumber>(
                "nft.exchange.lockedBalance",
                Utils.BigNumber.ZERO,
            );
            currentBidWallet.setAttribute<Utils.BigNumber>(
                "nft.exchange.lockedBalance",
                lockedBalance.minus(bidAmount),
            );
            this.walletRepository.forgetOnIndex(NFTExchangeIndexers.BidIndexer, bid.id);
        }

        auctionWallet.setBalance(auctionWallet.getBalance().plus(bidTransaction.asset.nftBid.bidAmount));

        delete auctionWalletAsset[auctionId];
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        this.walletRepository.forgetOnIndex(NFTExchangeIndexers.AuctionIndexer, auctionTransaction.id);
    }

    public override async revert(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revert(transaction);
        AppUtils.assert.defined<NFTInterfaces.NFTAcceptTradeAsset>(transaction.data.asset?.nftAcceptTrade);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const auctionId = transaction.data.asset.nftAcceptTrade.auctionId;
        const bidId = transaction.data.asset.nftAcceptTrade.bidId;

        const auctionTransaction = await this.transactionRepository.findById(auctionId);
        const bidTransaction = await this.transactionRepository.findById(bidId);

        const auctionWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const bidWallet = this.walletRepository.findByPublicKey(bidTransaction.senderPublicKey);

        const nftIds = auctionTransaction.asset.nftAuction.nftIds;

        const bidWalletBaseAsset = bidWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
        for (const nft of nftIds) {
            delete bidWalletBaseAsset[nft];
            this.walletRepository.forgetOnIndex(NFTBaseIndexers.NFTIndexers.NFTTokenIndexer, nft);
        }
        bidWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", bidWalletBaseAsset);

        const auctionWalletBaseAsset = auctionWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds");
        for (const nft of nftIds) {
            auctionWalletBaseAsset[nft] = {};
            this.walletRepository.setOnIndex(NFTBaseIndexers.NFTIndexers.NFTTokenIndexer, nft, auctionWallet);
        }
        auctionWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", auctionWalletBaseAsset);

        const activeBids: string[] = [];
        const bidTransactions = await this.transactionHistoryService.findManyByCriteria({
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTBid,
            asset: { nftBid: { auctionId: auctionTransaction.id } },
        });
        for (const bid of bidTransactions) {
            const bidCancel = await this.transactionHistoryService.findOneByCriteria({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTBidCancel,
                asset: { nftBidCancel: { bidId: bid.id } },
            });
            if (!bidCancel) {
                activeBids.push(bid.id!);
                const currentBidWallet = this.walletRepository.findByPublicKey(bid.senderPublicKey!);
                const bidAmount = bid.asset!.nftBid.bidAmount;

                currentBidWallet.setBalance(currentBidWallet.getBalance().minus(bidAmount));
                const lockedBalance = currentBidWallet.getAttribute<Utils.BigNumber>(
                    "nft.exchange.lockedBalance",
                    Utils.BigNumber.ZERO,
                );
                currentBidWallet.setAttribute<Utils.BigNumber>(
                    "nft.exchange.lockedBalance",
                    lockedBalance.plus(bidAmount),
                );
            }
        }
        const auctionWalletExchangeAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletExchangeAsset[auctionId] = {
            bids: activeBids,
            nftIds: nftIds,
        };
        auctionWallet.setBalance(auctionWallet.getBalance().minus(bidTransaction.asset.nftBid.bidAmount));
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletExchangeAsset);

        this.walletRepository.setOnIndex(NFTExchangeIndexers.AuctionIndexer, auctionId, auctionWallet);
        for (const bidId of auctionWalletExchangeAsset[auctionId]!.bids) {
            this.walletRepository.setOnIndex(NFTExchangeIndexers.BidIndexer, bidId, auctionWallet);
        }
        await this.emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTAcceptTradeRevert, transaction.data);
    }
}
