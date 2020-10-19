import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { ResourceWithBlock } from "../resources/resource-with-block";

@Container.injectable()
export class BaseController extends Controller {
	@Container.inject(Container.Identifiers.TransactionHistoryService)
	protected readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

	@Container.inject(Container.Identifiers.BlockHistoryService)
	private readonly blockHistoryService!: Contracts.Shared.BlockHistoryService;

	public async paginateWithBlock(
		criteria: Contracts.Shared.TransactionCriteria | Contracts.Shared.TransactionCriteria[],
		order: Contracts.Search.Sorting,
		page: Contracts.Search.Pagination,
		transform: boolean,
		resource,
	) {
		if (transform) {
			const transactionListResult = await this.transactionHistoryService.listByCriteriaJoinBlock(
				criteria,
				order,
				page,
			);
			return this.toPagination(transactionListResult, ResourceWithBlock(resource), true);
		} else {
			const transactionListResult = await this.transactionHistoryService.listByCriteria(criteria, order, page);
			return this.toPagination(transactionListResult, resource, false);
		}
	}

	public async respondWithBlockResource(
		transaction: Interfaces.ITransactionData,
		transform: boolean,
		resource,
		data?,
	) {
		if (transform) {
			const blockData = await this.blockHistoryService.findOneByCriteria({ id: transaction.blockId });
			return this.respondWithResource(
				{ data: data || transaction, block: blockData },
				ResourceWithBlock(resource),
				true,
			);
		} else {
			return this.respondWithResource(transaction, resource, false);
		}
	}
}
