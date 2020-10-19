import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-base-crypto";
import { Indexers } from "@protokol/nft-base-transactions";

import { AssetResource } from "../resources/assets";
import { WalletsResource } from "../resources/wallets";
import { BaseController } from "./base-controller";

@Container.injectable()
export class AssetsController extends BaseController {
	@Container.inject(Container.Identifiers.WalletRepository)
	@Container.tagged("state", "blockchain")
	private readonly walletRepository!: Contracts.State.WalletRepository;

	public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTCreate,
		};

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			AssetResource,
		);
	}

	public async showAssetWallet(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		let wallet: Contracts.State.Wallet;
		try {
			wallet = this.walletRepository.findByIndex(Indexers.NFTIndexers.NFTTokenIndexer, request.params.id);
		} catch (e) {
			return Boom.notFound("Asset not found or it was burned");
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
			return Boom.notFound("Asset not found");
		}
		return this.respondWithBlockResource(transaction, request.query.transform, AssetResource);
	}

	public async showByAsset(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTCreate,
			asset: { nftToken: { attributes: request.payload } },
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
