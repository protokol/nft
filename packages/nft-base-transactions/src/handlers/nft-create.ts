import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import {
    NFTBaseCollectionDoesNotExists,
    NFTBaseMaximumSupplyError,
    NFTBaseSchemaDoesNotMatch,
    NFTBaseSenderPublicKeyDoesNotExists,
    NFTMetadataDoesNotMatch,
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
        for await (const transaction of this.transactionHistoryService.streamByCriteria(this.getDefaultCriteria())) {
            AppUtils.assert.defined<string>(transaction.id);
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<NFTInterfaces.NFTTokenAsset>(transaction.asset?.nftToken);

            const wallet = this.getRecipientFromTx(transaction);

            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet[transaction.id] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
            this.walletRepository.setOnIndex(NFTIndexers.NFTTokenIndexer, transaction.id, wallet);

            const collectionId = transaction.asset.nftToken.collectionId;
            const genesisWallet = this.walletRepository.findByIndex(NFTIndexers.CollectionIndexer, collectionId);
            const genesisWalletCollection = genesisWallet.getAttribute<INFTCollections>("nft.base.collections");
            genesisWalletCollection[collectionId]!.currentSupply += 1;
            genesisWallet.setAttribute<INFTCollections>("nft.base.collections", genesisWalletCollection);
            await this.emitter.dispatchSeq(NFTApplicationEvents.NFTCreate, {
                ...transaction,
                owner: wallet.getPublicKey(),
            });
        }
    }

    public async emitEvents(
        transaction: Interfaces.ITransaction,
        emitter: Contracts.Kernel.EventDispatcher,
    ): Promise<void> {
        await emitter.dispatchSeq(NFTApplicationEvents.NFTCreate, {
            ...transaction.data,
            owner: this.getRecipientFromTx(transaction.data).getPublicKey(),
        });
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTTokenAsset>(transaction.data.asset?.nftToken);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        const nftTokenAsset: NFTInterfaces.NFTTokenAsset = transaction.data.asset.nftToken;
        let genesisWalletCollection: INFTCollection | undefined;

        try {
            const genesisWallet = this.walletRepository.findByIndex(
                NFTIndexers.CollectionIndexer,
                nftTokenAsset.collectionId,
            );
            genesisWalletCollection =
                genesisWallet.getAttribute<INFTCollections>("nft.base.collections")[nftTokenAsset.collectionId];
            AppUtils.assert.defined<INFTCollection>(genesisWalletCollection);
        } catch (e) {
            throw new NFTBaseCollectionDoesNotExists();
        }

        const { currentSupply, nftCollectionAsset } = genesisWalletCollection;
        if (
            nftCollectionAsset.allowedIssuers &&
            !nftCollectionAsset.allowedIssuers.includes(transaction.data.senderPublicKey)
        ) {
            throw new NFTBaseSenderPublicKeyDoesNotExists();
        }

        if (
            nftCollectionAsset.metadata &&
            AppUtils.isNotEqual(nftCollectionAsset.metadata, transaction.data.asset.nftToken.attributes)
        ) {
            throw new NFTMetadataDoesNotMatch();
        }

        const validate = await this.tokenSchemaValidatorCache.get(nftTokenAsset.collectionId);
        if (!validate?.(transaction.data.asset.nftToken.attributes)) {
            throw new NFTBaseSchemaDoesNotMatch();
        }

        if (currentSupply >= nftCollectionAsset.maximumSupply) {
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

        const recipient = this.getRecipientFromTx(transaction.data);

        const tokensWallet = recipient.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        tokensWallet[transaction.data.id] = {};
        recipient.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
        this.walletRepository.setOnIndex(NFTIndexers.NFTTokenIndexer, transaction.data.id, recipient);

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

        const recipient = this.getRecipientFromTx(transaction.data);

        const tokensWallet = recipient.getAttribute<INFTTokens>("nft.base.tokenIds");
        delete tokensWallet[transaction.data.id];
        recipient.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
        this.walletRepository.forgetOnIndex(NFTIndexers.NFTTokenIndexer, transaction.data.id);

        const collectionId = transaction.data.asset.nftToken.collectionId;
        const genesisWallet = this.walletRepository.findByIndex(NFTIndexers.CollectionIndexer, collectionId);
        const genesisWalletCollection = genesisWallet.getAttribute<INFTCollections>("nft.base.collections");
        genesisWalletCollection[collectionId]!.currentSupply -= 1;
        genesisWallet.setAttribute<INFTCollections>("nft.base.collections", genesisWalletCollection);

        await this.emitter.dispatchSeq(NFTApplicationEvents.NFTCreateRevert, {
            ...transaction.data,
            owner: recipient.getPublicKey(),
        });
    }

    private getRecipientFromTx(transaction: Interfaces.ITransactionData): Contracts.State.Wallet {
        const { recipientId } = transaction.asset!.nftToken;
        const recipient = recipientId
            ? this.walletRepository.findByAddress(recipientId)
            : this.walletRepository.findByPublicKey(transaction.senderPublicKey!);

        return recipient;
    }
}
