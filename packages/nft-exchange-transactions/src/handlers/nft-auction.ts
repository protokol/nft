import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Handlers as NFTBaseHandlers } from "@protokol/nft-base-transactions";
import { Interfaces as NFTBaseInterfaces } from "@protokol/nft-base-transactions";
import { Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

import {
    NFTExchangeAuctionAlreadyInProgress,
    NFTExchangeAuctioneerDoesNotOwnAnyNft,
    NFTExchangeAuctioneerDoesNotOwnNft,
    NFTExchangeAuctionExpired,
} from "../errors";
import { NFTExchangeApplicationEvents } from "../events";
import { INFTAuctions } from "../interfaces";
import { NFTExchangeIndexers } from "../wallet-indexes";
import { NFTExchangeTransactionHandler } from "./nft-exchange-handler";

@Container.injectable()
export class NFTAuctionHandler extends NFTExchangeTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTAuctionTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NFTBaseHandlers.NFTCreateHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["nft.exchange", "nft.exchange.auctions"];
    }

    public async bootstrap(): Promise<void> {
        for await (const transaction of this.transactionHistoryService.streamByCriteria(this.getDefaultCriteria())) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<NFTInterfaces.NFTAuctionAsset>(transaction.asset?.nftAuction);
            AppUtils.assert.defined<string>(transaction.id);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const nftAuctionAsset: NFTInterfaces.NFTAuctionAsset = transaction.asset.nftAuction;
            const auctionsWalletAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});

            auctionsWalletAsset[transaction.id] = {
                nftIds: nftAuctionAsset.nftIds,
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

            this.walletRepository.setOnIndex(NFTExchangeIndexers.AuctionIndexer, transaction.id, wallet);
            await this.emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTAuction, transaction);
        }
    }

    public override async emitEvents(
        transaction: Interfaces.ITransaction,
        emitter: Contracts.Kernel.EventDispatcher,
    ): Promise<void> {
        await emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTAuction, transaction.data);
    }

    public override async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTAuctionAsset>(transaction.data.asset?.nftAuction);
        const nftAuctionAsset: NFTInterfaces.NFTAuctionAsset = transaction.data.asset.nftAuction;

        const lastBlock: Interfaces.IBlock = this.app.get<any>(Container.Identifiers.StateStore).getLastBlock();

        if (lastBlock.data.height >= nftAuctionAsset.expiration.blockHeight) {
            throw new NFTExchangeAuctionExpired();
        }

        if (!sender.hasAttribute("nft.base.tokenIds")) {
            throw new NFTExchangeAuctioneerDoesNotOwnAnyNft();
        }

        const nftBaseWalletAsset = sender.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});

        for (const nft of nftAuctionAsset.nftIds) {
            if (!nftBaseWalletAsset[nft]) {
                throw new NFTExchangeAuctioneerDoesNotOwnNft();
            }
        }

        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions", {});

        for (const auction of Object.keys(auctionsWalletAsset)) {
            for (const nft of nftAuctionAsset.nftIds) {
                if (auctionsWalletAsset.hasOwnProperty(auction) && auctionsWalletAsset[auction]!.nftIds.includes(nft)) {
                    throw new NFTExchangeAuctionAlreadyInProgress();
                }
            }
        }

        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public override async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const nftIds: string = transaction.data.asset!.nftAuction.nftIds;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => {
                for (const nftId of nftIds) {
                    if (t.data.asset!.nftAuction.nftIds.includes(nftId)) {
                        return true;
                    }
                }
                return false;
            })
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT Auction, nft id for auction already in pool`,
                "ERR_PENDING",
            );
        }
    }

    public override async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(transaction.data.id);
        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTInterfaces.NFTAuctionAsset>(transaction.data.asset?.nftAuction);

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const nftAuctionAsset: NFTInterfaces.NFTAuctionAsset = transaction.data.asset!.nftAuction;
        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions", {});

        auctionsWalletAsset[transaction.data.id] = {
            nftIds: nftAuctionAsset.nftIds,
            bids: [],
        };
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);
        this.walletRepository.setOnIndex(NFTExchangeIndexers.AuctionIndexer, transaction.data.id, sender);
    }

    public override async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(transaction.data.id);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
        delete auctionsWalletAsset[transaction.data.id];
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

        this.walletRepository.forgetOnIndex(NFTExchangeIndexers.AuctionIndexer, transaction.data.id);
        await this.emitter.dispatchSeq(NFTExchangeApplicationEvents.NFTAuctionRevert, transaction.data);
    }
}
