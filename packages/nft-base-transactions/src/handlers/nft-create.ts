import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import {
    NFTBaseCollectionDoesNotExists,
    NFTBaseMaximumSupplyError,
    NFTBaseSchemaDoesNotMatch,
    NFTBaseSenderPublicKeyDoesNotExists,
} from "../errors";
import { NFTApplicationEvents } from "../events";
import { INFTCollection, INFTCollections, INFTTokens } from "../interfaces";
import { NFTIndexers } from "../wallet-indexes";
import { NFTBaseTransactionHandler } from "./nft-base-handler";
import { NFTRegisterCollectionHandler } from "./nft-register-collection";

const pluginName = require("../../package.json").name;

@Container.injectable()
export class NFTCreateHandler extends NFTBaseTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.CacheService)
    @Container.tagged("cache", pluginName)
    private readonly tokenSchemaValidatorCache!: Contracts.Kernel.CacheStore<string, any>;

    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTCreateTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NFTRegisterCollectionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["nft.base.tokenIds"];
    }

    public async bootstrap(): Promise<void> {
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<string>(transaction.id);
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<NFTInterfaces.NFTTokenAsset>(transaction.asset?.nftToken);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet[transaction.id] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
            this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).set(transaction.id, wallet);

            const collectionId = transaction.asset.nftToken.collectionId;
            const genesisWallet = this.walletRepository.findByIndex(NFTIndexers.CollectionIndexer, collectionId);
            const genesisWalletCollection = genesisWallet.getAttribute<INFTCollections>("nft.base.collections");
            genesisWalletCollection[collectionId]!.currentSupply += 1;
            genesisWallet.setAttribute<INFTCollections>("nft.base.collections", genesisWalletCollection);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTApplicationEvents.NFTCreate, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTTokenAsset>(transaction.data.asset?.nftToken);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        const nftTokenAsset: NFTInterfaces.NFTTokenAsset = transaction.data.asset.nftToken;
        let genesisWallet: Contracts.State.Wallet;
        let genesisWalletCollection: INFTCollection | undefined;

        try {
            genesisWallet = this.walletRepository.findByIndex(
                NFTIndexers.CollectionIndexer,
                nftTokenAsset.collectionId,
            );
            genesisWalletCollection = genesisWallet.getAttribute<INFTCollections>("nft.base.collections")[
                nftTokenAsset.collectionId
            ];
            AppUtils.assert.defined<INFTCollection>(genesisWalletCollection);
        } catch (e) {
            throw new NFTBaseCollectionDoesNotExists();
        }

        if (genesisWalletCollection.nftCollectionAsset.allowedIssuers) {
            if (!genesisWalletCollection.nftCollectionAsset.allowedIssuers.includes(transaction.data.senderPublicKey)) {
                throw new NFTBaseSenderPublicKeyDoesNotExists();
            }
        }

        const validate = await this.tokenSchemaValidatorCache.get(nftTokenAsset.collectionId);
        if (!validate?.(transaction.data.asset.nftToken.attributes)) {
            throw new NFTBaseSchemaDoesNotMatch();
        }

        if (genesisWalletCollection.currentSupply >= genesisWalletCollection.nftCollectionAsset.maximumSupply) {
            throw new NFTBaseMaximumSupplyError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(transaction.data.id);
        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTInterfaces.NFTTokenAsset>(transaction.data.asset?.nftToken);

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const tokensWallet = sender.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        tokensWallet[transaction.data.id] = {};
        sender.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
        this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).set(transaction.data.id, sender);

        const collectionId = transaction.data.asset!.nftToken.collectionId;
        const genesisWallet = this.walletRepository.findByIndex(NFTIndexers.CollectionIndexer, collectionId);
        const genesisWalletCollection = genesisWallet.getAttribute<INFTCollections>("nft.base.collections");
        genesisWalletCollection[collectionId]!.currentSupply += 1;
        genesisWallet.setAttribute<INFTCollections>("nft.base.collections", genesisWalletCollection);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(transaction.data.id);
        AppUtils.assert.defined<NFTInterfaces.NFTTokenAsset>(transaction.data.asset?.nftToken);

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const tokensWallet = sender.getAttribute<INFTTokens>("nft.base.tokenIds");
        delete tokensWallet[transaction.data.id];
        sender.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
        this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).forget(transaction.data.id);

        const collectionId = transaction.data.asset.nftToken.collectionId;
        const genesisWallet = this.walletRepository.findByIndex(NFTIndexers.CollectionIndexer, collectionId);
        const genesisWalletCollection = genesisWallet.getAttribute<INFTCollections>("nft.base.collections");
        genesisWalletCollection[collectionId]!.currentSupply -= 1;
        genesisWallet.setAttribute<INFTCollections>("nft.base.collections", genesisWalletCollection);
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
