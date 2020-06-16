import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Handlers as NFTBaseHandlers } from "@protokol/nft-base-transactions";
import { Interfaces as NFTBaseInterfaces } from "@protokol/nft-base-transactions";
import { Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";
import { Interfaces as NFTExchangeInterfaces } from "@protokol/nft-exchange-crypto";

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
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const nftAuctionAsset: NFTExchangeInterfaces.NFTAuctionAsset = transaction.asset.nftAuction;
            const auctionsWalletAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});

            auctionsWalletAsset[transaction.id] = {
                nftIds: nftAuctionAsset.nftIds,
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

            this.walletRepository.index(wallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTExchangeApplicationEvents.NFTAuction, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<NFTExchangeInterfaces.NFTAuctionAsset>(transaction.data.asset?.nftAuction);
        const nftAuctionAsset: NFTExchangeInterfaces.NFTAuctionAsset = transaction.data.asset.nftAuction;

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
                if (auctionsWalletAsset.hasOwnProperty(auction) && auctionsWalletAsset[auction].nftIds.includes(nft)) {
                    throw new NFTExchangeAuctionAlreadyInProgress();
                }
            }
        }

        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
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
                transaction,
            );
        }
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(transaction.data.id);
        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTExchangeInterfaces.NFTAuctionAsset>(transaction.data.asset?.nftAuction);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const nftAuctionAsset: NFTExchangeInterfaces.NFTAuctionAsset = transaction.data.asset!.nftAuction;
        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions", {});

        auctionsWalletAsset[transaction.data.id] = {
            nftIds: nftAuctionAsset.nftIds,
            bids: [],
        };
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);
        this.walletRepository.index(sender);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(transaction.data.id);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
        delete auctionsWalletAsset[transaction.data.id];
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

        this.walletRepository.forgetByIndex(NFTExchangeIndexers.AuctionIndexer, transaction.data.id);
        this.walletRepository.index(sender);
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
