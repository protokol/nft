import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-base-crypto";
import { Indexers } from "@protokol/nft-base-transactions";

import { AssetResource } from "../resources/assets";
import { WalletsResource } from "../resources/wallets";

@Container.injectable()
export class AssetsController extends Controller {
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
                type: Enums.NFTBaseTransactionTypes.NFTCreate,
            },
            this.getListingOrder(request),
            this.getListingPage(request),
        );

        return this.toPagination(transactionListResult, AssetResource, request.query.transform);
    }

    public async showAssetWallet(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        let wallet: Contracts.State.Wallet;
        try {
            wallet = this.walletRepository.findByIndex(Indexers.NFTIndexers.NFTTokenIndexer, request.params.id);
        } catch (e) {
            return Boom.notFound("Wallet not found");
        }

        return this.respondWithResource(wallet, WalletsResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTBaseTransactionGroup,
            type: Enums.NFTBaseTransactionTypes.NFTCreate,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Transaction not found");
        }
        return this.respondWithResource(transaction, AssetResource);
    }

    public async showByAsset(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions = await this.transactionHistoryService.listByCriteria(
            {
                ...request.query,
                typeGroup: Enums.NFTBaseTransactionGroup,
                type: Enums.NFTBaseTransactionTypes.NFTCreate,
                asset: { nftToken: { attributes: request.payload } },
            },
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, AssetResource);
    }
}
