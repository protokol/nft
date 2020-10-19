import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-base-crypto";
import { Indexers } from "@protokol/nft-base-transactions";

import { AssetResource } from "../resources/assets";
import { CollectionResource } from "../resources/collections";
import { SchemaResource } from "../resources/schema";
import { WalletsResource } from "../resources/wallets";
import { BaseController } from "./base-controller";

@Container.injectable()
export class CollectionsController extends BaseController {
	@Container.inject(Container.Identifiers.WalletRepository)
	@Container.tagged("state", "blockchain")
	private readonly walletRepository!: Contracts.State.WalletRepository;

	public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTRegisterCollection,
		};

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			CollectionResource,
		);
	}

	public async showByWalletId(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		let wallet: Contracts.State.Wallet;
		try {
			wallet = this.walletRepository.findByIndex(Indexers.NFTIndexers.CollectionIndexer, request.params.id);
		} catch (e) {
			return Boom.notFound("Collection not found");
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
		return this.respondWithBlockResource(transaction, request.query.transform, CollectionResource);
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
		return this.respondWithBlockResource(transaction, request.query.transform, SchemaResource);
	}

	public async searchCollection(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTRegisterCollection,
			asset: { nftCollection: request.payload },
		};

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			CollectionResource,
		);
	}

	public async showAssetsByCollectionId(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTCreate,
			asset: { nftToken: { collectionId: request.params.id } },
		};

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			AssetResource,
		);
	}
}
