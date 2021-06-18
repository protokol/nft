import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { getCustomRepository } from "typeorm";

import { Asset } from "../entities";
import { AssetRepository } from "../repositories/asset-repository";
import { AssetResource } from "../resources/assets";
import { BaseController } from "./base";

@Container.injectable()
export class AssetController extends BaseController<Asset> {
	@Container.inject(Container.Identifiers.WalletRepository)
	@Container.tagged("state", "blockchain")
	private readonly walletRepository!: Contracts.State.WalletRepository;

	public async showWalletAssets(
		request: Hapi.Request,
	): Promise<
		| Boom.Boom
		| Contracts.Search.ResultsPage<ReturnType<AssetResource["raw"]>>
		| Contracts.Search.ResultsPage<ReturnType<AssetResource["transform"]>>
	> {
		const owner = request.params.id;
		const { inAuction, inExpiredAuction } = request.query;

		if (!this.walletRepository.hasByPublicKey(owner)) {
			return Boom.notFound("Wallet not found");
		}

		const query = getCustomRepository(AssetRepository).getAssetsQuery(
			owner,
			inAuction,
			inExpiredAuction,
			this.stateStore.getLastBlock(),
		);

		return this.paginateWithBlock(query, request, AssetResource);
	}
}
