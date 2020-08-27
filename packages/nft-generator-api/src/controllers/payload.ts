import { Controller } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";

import { buildResponse } from "../utils/client";
import {
	buildAcceptTrade,
	buildAuction,
	buildAuctionCancel,
	buildBid,
	buildBidCancel,
} from "../utils/exchange-transactions";
import { buildTokenAsset, buildTokenBurn, buildTokenCollection, buildTokenTransfer } from "../utils/transactions";

@Container.injectable()
export class PayloadController extends Controller {
	public async hello(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		return { sparta: "moanlabe" };
	}

	public async generateTokenCollection(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await buildTokenCollection({ ...request.payload });

		return buildResponse(transaction, request.query.apply);
	}

	public async generateTokenAsset(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await buildTokenAsset({ ...request.payload });

		return buildResponse(transaction, request.query.apply);
	}

	public async generateTokenTransfer(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await buildTokenTransfer({ ...request.payload });

		return buildResponse(transaction, request.query.apply);
	}

	public async generateTokenBurn(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await buildTokenBurn({ ...request.payload });

		return buildResponse(transaction, request.query.apply);
	}

	public async generateTokenAuction(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await buildAuction({ ...request.payload });

		return buildResponse(transaction, request.query.apply);
	}

	public async generateTokenAuctionCancel(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await buildAuctionCancel({ ...request.payload });

		return buildResponse(transaction, request.query.apply);
	}

	public async generateTokenBid(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await buildBid({ ...request.payload });

		return buildResponse(transaction, request.query.apply);
	}

	public async generateTokenBidCancel(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await buildBidCancel({ ...request.payload });

		return buildResponse(transaction, request.query.apply);
	}

	public async generateTokenAcceptTrade(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await buildAcceptTrade({ ...request.payload });

		return buildResponse(transaction, request.query.apply);
	}
}
