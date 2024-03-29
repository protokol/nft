import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import Ajv from "ajv";

import { NFTBaseInvalidAjvSchemaError, NFTBaseUnauthorizedCollectionRegistrator } from "../errors";
import { NFTApplicationEvents } from "../events";
import { INFTCollections } from "../interfaces";
import { NFTIndexers } from "../wallet-indexes";
import { NFTBaseTransactionHandler } from "./nft-base-handler";

const pluginName = require("../../package.json").name;

@Container.injectable()
export class NFTRegisterCollectionHandler extends NFTBaseTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.CacheService)
    @Container.tagged("cache", pluginName)
    private readonly tokenSchemaValidatorCache!: Contracts.Kernel.CacheStore<string, any>;

    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTRegisterCollectionTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["nft.base", "nft.base.collections"];
    }

    public async bootstrap(): Promise<void> {
        for await (const transaction of this.transactionHistoryService.streamByCriteria(this.getDefaultCriteria())) {
            AppUtils.assert.defined<string>(transaction.id);
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<NFTInterfaces.NFTCollectionAsset>(transaction.asset?.nftCollection);

            const senderWallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const collectionAsset: NFTInterfaces.NFTCollectionAsset = transaction.asset.nftCollection;
            const collectionsWallet = senderWallet.getAttribute<INFTCollections>("nft.base.collections", {});

            collectionsWallet[transaction.id] = {
                currentSupply: 0,
                nftCollectionAsset: collectionAsset,
            };
            await this.compileAndPersistSchema(transaction.id, collectionAsset.jsonSchema);

            senderWallet.setAttribute("nft.base.collections", collectionsWallet);
            this.walletRepository.setOnIndex(NFTIndexers.CollectionIndexer, transaction.id, senderWallet);
        }
    }

    public override emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        void emitter.dispatch(NFTApplicationEvents.NFTRegisterCollection, transaction.data);
    }

    public override async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTCollectionAsset>(transaction.data.asset?.nftCollection);
        const nftCollectionAsset: NFTInterfaces.NFTCollectionAsset = transaction.data.asset.nftCollection;

        const ajv = new Ajv({
            allErrors: true,
        });
        if (!ajv.validateSchema(nftCollectionAsset.jsonSchema)) {
            throw new NFTBaseInvalidAjvSchemaError();
        }

        const authorizedRegistrators = this.configuration.get<string[]>("authorizedRegistrators");
        if (
            sender.getPublicKey() &&
            authorizedRegistrators?.length &&
            !authorizedRegistrators.includes(sender.getPublicKey()!)
        ) {
            throw new NFTBaseUnauthorizedCollectionRegistrator();
        }
        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public override async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTInterfaces.NFTCollectionAsset>(transaction.data.asset?.nftCollection);
        AppUtils.assert.defined<string>(transaction.data.id);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const collectionAsset: NFTInterfaces.NFTCollectionAsset = transaction.data.asset!.nftCollection;
        const collectionsWallet = senderWallet.getAttribute<INFTCollections>("nft.base.collections", {});

        collectionsWallet[transaction.data.id] = {
            currentSupply: 0,
            nftCollectionAsset: collectionAsset,
        };
        senderWallet.setAttribute("nft.base.collections", collectionsWallet);
        await this.compileAndPersistSchema(transaction.id, collectionAsset.jsonSchema);

        this.walletRepository.setOnIndex(NFTIndexers.CollectionIndexer, transaction.data.id, senderWallet);
    }

    public override async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.id);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const collectionsWallet = senderWallet.getAttribute<INFTCollections>("nft.base.collections");
        delete collectionsWallet[transaction.data.id];
        senderWallet.setAttribute("nft.base.collections", collectionsWallet);
        await this.tokenSchemaValidatorCache.forget(transaction.id!);

        this.walletRepository.forgetOnIndex(NFTIndexers.CollectionIndexer, transaction.data.id);
    }

    private async compileAndPersistSchema(id, jsonSchema) {
        const ajv = new Ajv({ allErrors: true });
        const validate = ajv.compile({
            additionalProperties: false,
            ...jsonSchema,
        });
        await this.tokenSchemaValidatorCache.put(id, validate, -1);
    }
}
