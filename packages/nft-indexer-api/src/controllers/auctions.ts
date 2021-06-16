import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { getCustomRepository } from "typeorm";

import { Auction } from "../entities";
import { AuctionRepository } from "../repositories/auction-repository";
import { AuctionResource } from "../resources/auctions";
import { BaseController } from "./base";

@Container.injectable()
export class AuctionController extends BaseController<Auction> {
	@Container.inject(Container.Identifiers.StateStore)
	private readonly stateStore!: Contracts.State.StateStore;

	public async index(
		request: Hapi.Request,
	): Promise<
		| Boom.Boom
		| Contracts.Search.ResultsPage<ReturnType<AuctionResource["raw"]>>
		| Contracts.Search.ResultsPage<ReturnType<AuctionResource["transform"]>>
	> {
		const { expired } = request.query;
		const query = getCustomRepository(AuctionRepository).getAuctions(this.stateStore.getLastBlock(), expired);

		return this.paginateWithBlock(query, request, AuctionResource);
	}
}
