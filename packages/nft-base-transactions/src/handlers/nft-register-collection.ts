import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import Ajv from "ajv";

import { NFTBaseInvalidAjvSchemaError, NFTBaseUnauthorizedCollectionRegistrator } from "../errors";
import { NFTApplicationEvents } from "../events";
import { INFTCollections } from "../interfaces";
import { NFTIndexers } from "../wallet-indexes";
import { NFTBaseTransactionHandler } from "./nft-base-handler";

@Container.injectable()
export class NFTRegisterCollectionHandler extends NFTBaseTransactionHandler {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@protokol/nft-base-transactions")
    private readonly configuration!: Providers.PluginConfiguration;

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
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const senderWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                transaction.senderPublicKey,
            );
            const collectionAsset: NFTInterfaces.NFTCollectionAsset = transaction.asset.nftCollection;
            const collectionsWallet = senderWallet.getAttribute<INFTCollections>("nft.base.collections", {});

            collectionsWallet[transaction.id] = {
                currentSupply: 0,
                nftCollectionAsset: collectionAsset,
            };

            senderWallet.setAttribute("nft.base.collections", collectionsWallet);
            this.walletRepository.index(senderWallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTApplicationEvents.NFTRegisterCollection, transaction.data);
    }

    public async throwIfCannotBeApplied(
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
        if (sender.publicKey && authorizedRegistrators?.length && !authorizedRegistrators.includes(sender.publicKey)) {
            throw new NFTBaseUnauthorizedCollectionRegistrator();
        }
        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTInterfaces.NFTCollectionAsset>(transaction.data.asset?.nftCollection);
        AppUtils.assert.defined<string>(transaction.data.id);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
            transaction.data.senderPublicKey,
        );

        const collectionAsset: NFTInterfaces.NFTCollectionAsset = transaction.data.asset!.nftCollection;
        const collectionsWallet = senderWallet.getAttribute<INFTCollections>("nft.base.collections", {});

        collectionsWallet[transaction.data.id] = {
            currentSupply: 0,
            nftCollectionAsset: collectionAsset,
        };
        senderWallet.setAttribute("nft.base.collections", collectionsWallet);

        this.walletRepository.index(senderWallet);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.id);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
            transaction.data.senderPublicKey,
        );

        const collectionsWallet = senderWallet.getAttribute<INFTCollections>("nft.base.collections");
        delete collectionsWallet[transaction.data.id];
        senderWallet.setAttribute("nft.base.collections", collectionsWallet);

        this.walletRepository.forgetByIndex(NFTIndexers.CollectionIndexer, transaction.data.id);
        this.walletRepository.index(senderWallet);
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
