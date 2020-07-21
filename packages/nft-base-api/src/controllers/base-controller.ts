import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";

import { ResourceWithBlock } from "../resources/resource-with-block";

@Container.injectable()
export class BaseController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    protected readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public async paginateWithBlock(
        criteria: Contracts.Shared.TransactionCriteria | Contracts.Shared.TransactionCriteria[],
        order: Contracts.Search.ListOrder,
        page: Contracts.Search.ListPage,
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
}
