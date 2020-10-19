import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-base-crypto";

import { TransferResource } from "../resources/transfer";
import { BaseController } from "./base-controller";

@Container.injectable()
export class TransfersController extends BaseController {
	public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTTransfer,
		};

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			TransferResource,
		);
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
		return this.respondWithBlockResource(transaction, request.query.transform, TransferResource);
	}
}
