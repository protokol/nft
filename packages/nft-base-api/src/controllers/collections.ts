import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-base-crypto";
import { Indexers } from "@protokol/nft-base-transactions";

import { AssetResource } from "../resources/assets";
import { CollectionResource } from "../resources/collections";
import { SchemaResource } from "../resources/schema";
import { WalletsResource } from "../resources/wallets";

@Container.injectable()
export class CollectionsController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactionListResult = await this.transactionHistoryService.listByCriteria(
            {
                ...request.query,
                typeGroup: Enums.NFTBaseTransactionGroup,
                type: Enums.NFTBaseTransactionTypes.NFTRegisterCollection,
            },
            this.getListingOrder(request),
            this.getListingPage(request),
        );

        return this.toPagination(transactionListResult, CollectionResource, request.query.transform);
    }

    // todo rethink implementation and introduce transformer
    public async showByWalletId(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        let wallet: Contracts.State.Wallet;
        try {
            wallet = this.walletRepository.findByIndex(Indexers.NFTIndexers.CollectionIndexer, request.params.id);
        } catch (e) {
            return Boom.notFound("Wallet not found");
        }

        return this.respondWithResource(wallet, WalletsResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTBaseTransactionGroup,
            type: Enums.NFTBaseTransactionTypes.NFTRegisterCollection,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Collection not found");
        }
        return this.respondWithResource(transaction, CollectionResource);
    }

    public async showSchema(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTBaseTransactionGroup,
            type: Enums.NFTBaseTransactionTypes.NFTRegisterCollection,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Collection not found");
        }
        return this.respondWithResource(transaction, SchemaResource);
    }

    public async searchCollection(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions = await this.transactionHistoryService.listByCriteria(
            {
                ...request.query,
                typeGroup: Enums.NFTBaseTransactionGroup,
                type: Enums.NFTBaseTransactionTypes.NFTRegisterCollection,
                asset: { nftCollection: request.payload },
            },
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        if (!transactions) {
            return Boom.notFound("No Collections not found");
        }

        return this.toPagination(transactions, CollectionResource);
    }

    public async showAssetsByCollectionId(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions = await this.transactionHistoryService.listByCriteria(
            {
                ...request.query,
                typeGroup: Enums.NFTBaseTransactionGroup,
                type: Enums.NFTBaseTransactionTypes.NFTCreate,
                asset: { nftToken: { collectionId: request.params.id } },
            },
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, AssetResource);
    }
}
