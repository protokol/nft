import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-base-crypto";

import { BurnsResource } from "../resources/burns";

@Container.injectable()
export class BurnsController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactionListResult = await this.transactionHistoryService.listByCriteria(
            {
                ...request.query,
                typeGroup: Enums.NFTBaseTransactionGroup,
                type: Enums.NFTBaseTransactionTypes.NFTBurn,
            },
            this.getListingOrder(request),
            this.getListingPage(request),
        );

        return this.toPagination(transactionListResult, BurnsResource, request.query.transform);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTBaseTransactionGroup,
            type: Enums.NFTBaseTransactionTypes.NFTBurn,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Burn Transaction not found");
        }
        return this.respondWithResource(transaction, BurnsResource);
    }
}
