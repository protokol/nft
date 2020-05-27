import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { Indexers as NFTBaseIndexers, Interfaces as NFTBaseInterfaces } from "@protokol/nft-base-transactions";
import { Enums, Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

import {
    NFTExchangeAcceptTradeAuctionCanceled,
    NFTExchangeAcceptTradeAuctionDoesNotExists,
    NFTExchangeAcceptTradeBidCanceled,
    NFTExchangeAcceptTradeBidDoesNotExists,
    NFTExchangeAcceptTradeWalletCannotTrade,
} from "../errors";
import { NFTApplicationEvents } from "../events";
import { INFTAuctions } from "../interfaces";
import { NFTExchangeIndexers } from "../wallet-indexes";
import { NFTAuctionHandler } from "./nft-auction";
import { NFTBidHandler } from "./nft-bid";

@Container.injectable()
export class NFTAcceptTradeHandler extends Handlers.TransactionHandler {
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

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const auctionId = transaction.asset.nftAcceptTrade.auctionId;
            const bidId = transaction.asset.nftAcceptTrade.bidId;

            const auctionTransaction = await this.transactionRepository.findById(auctionId);
            const bidTransaction = await this.transactionRepository.findById(bidId);

            const auctionWallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const bidWallet = this.walletRepository.findByPublicKey(bidTransaction.senderPublicKey);

            const nftId = auctionTransaction.asset.nftAuction.nftId;

            const auctionWalletBaseAsset = auctionWallet.getAttribute<NFTBaseInterfaces.INFTTokens>(
                "nft.base.tokenIds",
            );
            delete auctionWalletBaseAsset[nftId];
            auctionWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", auctionWalletBaseAsset);
            this.walletRepository.forgetByIndex(NFTBaseIndexers.NFTIndexers.NFTTokenIndexer, nftId);

            const bidWalletBaseAsset = bidWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            bidWalletBaseAsset[nftId] = {};
            bidWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", bidWalletBaseAsset);

            const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
            for (const bid of auctionWalletAsset[auctionId].bids) {
                if (bid !== bidId) {
                    const currentBidTransaction = await this.transactionRepository.findById(bid);
                    const currentBidWallet = this.walletRepository.findByPublicKey(
                        currentBidTransaction.senderPublicKey,
                    );
                    currentBidWallet.balance = currentBidWallet.balance.plus(
                        currentBidTransaction.asset.nftBid.bidAmount,
                    );
                }
                this.walletRepository.forgetByIndex(NFTExchangeIndexers.BidIndexer, bid);
            }
            auctionWallet.balance = auctionWallet.balance.plus(bidTransaction.asset.nftBid.bidAmount);

            delete auctionWalletAsset[auctionId];
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

            this.walletRepository.forgetByIndex(NFTExchangeIndexers.AuctionIndexer, auctionTransaction.id);
            this.walletRepository.index(auctionWallet);
            this.walletRepository.index(bidWallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTApplicationEvents.NFTAcceptTrade, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
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

        if (!auctionWalletAsset[auctionId].bids.some((bid) => bid === bidId)) {
            throw new NFTExchangeAcceptTradeBidCanceled();
        }
        return super.throwIfCannotBeApplied(transaction, sender, customWalletRepository);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const auctionId: string = transaction.data.asset!.nftAcceptTrade.auctionId;
        const bidId: string = transaction.data.asset!.nftAcceptTrade.bidId;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset?.nftAcceptTrade.auctionId === auctionId)
            .wherePredicate((t) => t.data.asset?.nftAcceptTrade.bidId === bidId)
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT Accept Trade, Accept Trade for auction ${auctionId} and bid ${bidId} already in pool`,
                "ERR_PENDING",
                transaction,
            );
        }
    }

    public async apply(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.apply(transaction, customWalletRepository);
        AppUtils.assert.defined<NFTInterfaces.NFTAcceptTradeAsset>(transaction.data.asset?.nftAcceptTrade);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const auctionId = transaction.data.asset.nftAcceptTrade.auctionId;
        const bidId = transaction.data.asset.nftAcceptTrade.bidId;

        const auctionTransaction = await this.transactionRepository.findById(auctionId);
        const bidTransaction = await this.transactionRepository.findById(bidId);

        const auctionWallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const bidWallet = walletRepository.findByPublicKey(bidTransaction.senderPublicKey);

        const nftId = auctionTransaction.asset.nftAuction.nftId;

        const auctionWalletBaseAsset = auctionWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds");
        delete auctionWalletBaseAsset[nftId];
        auctionWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", auctionWalletBaseAsset);
        walletRepository.forgetByIndex(NFTBaseIndexers.NFTIndexers.NFTTokenIndexer, nftId);

        const bidWalletBaseAsset = bidWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
        bidWalletBaseAsset[nftId] = {};
        bidWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", bidWalletBaseAsset);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        for (const bid of auctionWalletAsset[auctionId].bids) {
            if (bid !== bidId) {
                const currentBidTransaction = await this.transactionRepository.findById(bid);
                const currentBidWallet = walletRepository.findByPublicKey(currentBidTransaction.senderPublicKey);
                currentBidWallet.balance = currentBidWallet.balance.plus(currentBidTransaction.asset.nftBid.bidAmount);
            }
            walletRepository.forgetByIndex(NFTExchangeIndexers.BidIndexer, bid);
        }
        auctionWallet.balance = auctionWallet.balance.plus(bidTransaction.asset.nftBid.bidAmount);

        delete auctionWalletAsset[auctionId];
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        walletRepository.forgetByIndex(NFTExchangeIndexers.AuctionIndexer, auctionTransaction.id);
        walletRepository.index(auctionWallet);
        walletRepository.index(bidWallet);
    }

    public async revert(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revert(transaction, customWalletRepository);
        AppUtils.assert.defined<NFTInterfaces.NFTAcceptTradeAsset>(transaction.data.asset?.nftAcceptTrade);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const auctionId = transaction.data.asset.nftAcceptTrade.auctionId;
        const bidId = transaction.data.asset.nftAcceptTrade.bidId;

        const auctionTransaction = await this.transactionRepository.findById(auctionId);
        const bidTransaction = await this.transactionRepository.findById(bidId);

        const auctionWallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const bidWallet = walletRepository.findByPublicKey(bidTransaction.senderPublicKey);

        const nftId = auctionTransaction.asset.nftAuction.nftId;

        const auctionWalletBaseAsset = auctionWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds");
        auctionWalletBaseAsset[nftId] = {};
        auctionWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", auctionWalletBaseAsset);

        const bidWalletBaseAsset = bidWallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
        delete bidWalletBaseAsset[nftId];
        bidWallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", bidWalletBaseAsset);
        walletRepository.forgetByIndex(NFTBaseIndexers.NFTIndexers.NFTTokenIndexer, nftId);

        const activeBids: string[] = [];
        const bidTransactions = await this.transactionHistoryService.findManyByCriteria({
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTBid,
            asset: { nftBid: { auctionId: auctionTransaction.id } },
        });
        if (bidTransactions) {
            for (const bid of bidTransactions) {
                const bidCancel = await this.transactionHistoryService.findOneByCriteria({
                    typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                    type: Enums.NFTTransactionTypes.NFTBidCancel,
                    asset: { nftBidCancel: { bidId: bid.id } },
                });
                if (!bidCancel) {
                    // @ts-ignore
                    activeBids.push(bid.id);
                    // @ts-ignore
                    const currentBidWallet = this.walletRepository.findByPublicKey(bid.senderPublicKey);
                    currentBidWallet.balance = currentBidWallet.balance.minus(bid.asset?.nftBid.bidAmount);
                }
            }
        }
        const auctionWalletExchangeAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletExchangeAsset[auctionId] = {
            bids: activeBids,
            nftId: nftId,
        };
        auctionWallet.balance = auctionWallet.balance.minus(bidTransaction.asset.nftBid.bidAmount);
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletExchangeAsset);

        walletRepository.index(auctionWallet);
        walletRepository.index(bidWallet);
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