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

	@Container.inject(Container.Identifiers.StateStore)
	protected readonly stateStore!: Contracts.State.StateStore;

	public async paginateWithBlock(
		query: SelectQueryBuilder<T>,
		request: Hapi.Request,
		resource,
		resolveBlockProperty?: string,
	) {
		const pagination = this.getListingPage(request);
		const transform = request.query.transform;
		query.skip(pagination.offset);
		query.take(pagination.limit);
		const [results, totalCount] = await query.getManyAndCount();
		const resultsPage = { results, totalCount, meta: { totalCountIsEstimate: false } };

		if (transform) {
			const blocks = await this.blockHistoryService.findManyByCriteria(
				results.flatMap((x) => {
					const subBlocks = resolveBlockProperty && x[resolveBlockProperty].map((y) => ({ id: y.blockId }));
					return [{ id: x.blockId }, ...(subBlocks || [])];
				}),
			);
			resultsPage.results = results.map((data) => {
				const block = blocks.find((block) => block.id === data.blockId);
				if (resolveBlockProperty) {
					data[resolveBlockProperty] = data[resolveBlockProperty].map((x) => {
						const subBlock = blocks.find((block) => block.id === x.blockId);
						return { data: x, block: subBlock };
					});
				}

				return { data, block };
			}) as any;
			return this.toPagination(resultsPage, ResourceWithBlock(resource), true);
		} else {
			return this.toPagination(resultsPage, resource, false);
		}
	}
}
