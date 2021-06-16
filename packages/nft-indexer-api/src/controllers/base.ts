import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";
import { SelectQueryBuilder } from "typeorm";

import { BaseEntity } from "../entities";
import { ResourceWithBlock } from "../resources/resource-with-block";

@Container.injectable()
export class BaseController<T extends BaseEntity> extends Controller {
	@Container.inject(Container.Identifiers.BlockHistoryService)
	private readonly blockHistoryService!: Contracts.Shared.BlockHistoryService;

	public async paginateWithBlock(query: SelectQueryBuilder<T>, request: Hapi.Request, resource) {
		const pagination = this.getListingPage(request);
		const transform = request.query.transform;
		query.skip(pagination.offset);
		query.take(pagination.limit);
		const [results, totalCount] = await query.getManyAndCount();
		const resultsPage = { results, totalCount, meta: { totalCountIsEstimate: false } };

		if (transform) {
			const blocks = await this.blockHistoryService.findManyByCriteria(results.map((x) => ({ id: x.blockId })));
			resultsPage.results = results.map((data) => {
				const block = blocks.find((block) => block.id === data.blockId);
				return { data, block };
			}) as any;
			return this.toPagination(resultsPage, ResourceWithBlock(resource), true);
		} else {
			return this.toPagination(resultsPage, resource, false);
		}
	}
}
