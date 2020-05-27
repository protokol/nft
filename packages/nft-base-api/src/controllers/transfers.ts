import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-base-crypto";

import { TransferResource } from "../resources/transfer";

@Container.injectable()
export class TransfersController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactionListResult = await this.transactionHistoryService.listByCriteria(
            {
                ...request.query,
                typeGroup: Enums.NFTBaseTransactionGroup,
                type: Enums.NFTBaseTransactionTypes.NFTTransfer,
            },
            this.getListingOrder(request),
            this.getListingPage(request),
        );

        return this.toPagination(transactionListResult, TransferResource, request.query.transform);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTBaseTransactionGroup,
            type: Enums.NFTBaseTransactionTypes.NFTTransfer,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("NTF Transfer Transaction not found");
        }
        return this.respondWithResource(transaction, TransferResource);
    }
}
