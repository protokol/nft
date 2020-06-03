import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
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

@Container.injectable()
export class NFTAuctionHandler extends Handlers.TransactionHandler {
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

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
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
        customWalletRepository?: Contracts.State.WalletRepository,
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

        return super.throwIfCannotBeApplied(transaction, sender, customWalletRepository);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const nftId: string = transaction.data.asset!.nftAuction.nftId;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset?.nftAuction.nftId === nftId)
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT Auction, auction for ${nftId} nft already in pool`,
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
        AppUtils.assert.defined<string>(transaction.data.id);
        AppUtils.assert.defined<NFTExchangeInterfaces.NFTAuctionAsset>(transaction.data.asset?.nftAuction);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const nftAuctionAsset: NFTExchangeInterfaces.NFTAuctionAsset = transaction.data.asset.nftAuction;
        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions", {});

        auctionsWalletAsset[transaction.data.id] = {
            nftIds: nftAuctionAsset.nftIds,
            bids: [],
        };
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);
        walletRepository.index(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(transaction.data.id);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const auctionsWalletAsset = sender.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
        delete auctionsWalletAsset[transaction.data.id];
        sender.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsWalletAsset);

        walletRepository.forgetByIndex(NFTExchangeIndexers.AuctionIndexer, transaction.data.id);
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
