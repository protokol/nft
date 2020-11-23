import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import {
    NFTBaseBurnCannotBeApplied,
    NFTBaseBurnNFTIsOnAuction,
    NFTBaseBurnWalletDoesntOwnSpecifiedToken,
} from "../errors";
import { NFTApplicationEvents } from "../events";
import { INFTCollections, INFTTokens } from "../interfaces";
import { NFTIndexers } from "../wallet-indexes";
import { NFTBaseTransactionHandler } from "./nft-base-handler";
import { NFTCreateHandler } from "./nft-create";

@Container.injectable()
export class NFTBurnHandler extends NFTBaseTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTBurnTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NFTCreateHandler];
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
            AppUtils.assert.defined<NFTInterfaces.NFTBurnAsset>(transaction.asset?.nftBurn);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            const nftBurnAsset: NFTInterfaces.NFTBurnAsset = transaction.asset.nftBurn;

            const tokenIdsWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds");
            delete tokenIdsWallet[nftBurnAsset.nftId];
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokenIdsWallet);
            this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).forget(nftBurnAsset.nftId);

            const nftCreateTransaction = await this.transactionRepository.findById(nftBurnAsset.nftId);
            const collectionId = nftCreateTransaction.asset.nftToken.collectionId;
            const genesisWallet = this.walletRepository.findByIndex(NFTIndexers.CollectionIndexer, collectionId);

            const collectionsWallet = genesisWallet.getAttribute<INFTCollections>("nft.base.collections");
            collectionsWallet[collectionId]!.currentSupply -= 1;
            collectionsWallet[collectionId]!.nftCollectionAsset.maximumSupply -= 1;
            genesisWallet.setAttribute<INFTCollections>("nft.base.collections", collectionsWallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTApplicationEvents.NFTBurn, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTBurnAsset>(transaction.data.asset?.nftBurn);
        const nftBurnAsset: NFTInterfaces.NFTBurnAsset = transaction.data.asset.nftBurn;

        if (!wallet.hasAttribute("nft.base.tokenIds")) {
            throw new NFTBaseBurnCannotBeApplied();
        }
        const nftBaseWalletAsset = wallet.getAttribute<INFTTokens>("nft.base.tokenIds");
        if (!nftBaseWalletAsset[nftBurnAsset.nftId]) {
            throw new NFTBaseBurnWalletDoesntOwnSpecifiedToken();
        }

        const auctionsWalletAsset = wallet.getAttribute("nft.exchange.auctions", {});

        for (const auction of Object.keys(auctionsWalletAsset)) {
            if (
                auctionsWalletAsset.hasOwnProperty(auction) &&
                auctionsWalletAsset[auction].nftIds.includes(nftBurnAsset.nftId)
            ) {
                throw new NFTBaseBurnNFTIsOnAuction();
            }
        }
        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const nftId: string = transaction.data.asset!.nftBurn.nftId;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset!.nftBurn.nftId === nftId)
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT Burn, nftId for "${nftId}" already in pool`,
                "ERR_PENDING",
            );
        }
    }
    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTInterfaces.NFTBurnAsset>(transaction.data.asset?.nftBurn);

        const nftBurnAsset: NFTInterfaces.NFTBurnAsset = transaction.data.asset!.nftBurn;

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const tokenIdsWallet = sender.getAttribute<INFTTokens>("nft.base.tokenIds");
        delete tokenIdsWallet[nftBurnAsset.nftId];
        sender.setAttribute<INFTTokens>("nft.base.tokenIds", tokenIdsWallet);
        this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).forget(nftBurnAsset.nftId);

        const nftCreateTransaction = await this.transactionRepository.findById(nftBurnAsset.nftId);
        const collectionId = nftCreateTransaction.asset.nftToken.collectionId;
        const genesisWallet = this.walletRepository.findByIndex(NFTIndexers.CollectionIndexer, collectionId);

        const collectionsWallet = genesisWallet.getAttribute<INFTCollections>("nft.base.collections");
        collectionsWallet[collectionId]!.currentSupply -= 1;
        collectionsWallet[collectionId]!.nftCollectionAsset.maximumSupply -= 1;
        genesisWallet.setAttribute<INFTCollections>("nft.base.collections", collectionsWallet);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTBurnAsset>(transaction.data.asset?.nftBurn);

        const nftBurnAsset: NFTInterfaces.NFTBurnAsset = transaction.data.asset.nftBurn;

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const tokenIdsWallet = sender.getAttribute<INFTTokens>("nft.base.tokenIds");
        tokenIdsWallet[nftBurnAsset.nftId] = {};
        sender.setAttribute<INFTTokens>("nft.base.tokenIds", tokenIdsWallet);
        this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).set(nftBurnAsset.nftId, sender);

        const nftCreateTransaction = await this.transactionRepository.findById(nftBurnAsset.nftId);
        const collectionId = nftCreateTransaction.asset.nftToken.collectionId;
        const genesisWallet = this.walletRepository.findByIndex(NFTIndexers.CollectionIndexer, collectionId);

        const collectionsWallet = genesisWallet.getAttribute<INFTCollections>("nft.base.collections");
        collectionsWallet[collectionId]!.currentSupply += 1;
        collectionsWallet[collectionId]!.nftCollectionAsset.maximumSupply += 1;
        genesisWallet.setAttribute<INFTCollections>("nft.base.collections", collectionsWallet);
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
