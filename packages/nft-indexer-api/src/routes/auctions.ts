import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "joi";

import { AuctionController } from "../controllers/auctions";
import { changeRouteHandler } from "../utils";

export const register = (server: Hapi.Server): void => {
	const controller = server.app.app.resolve(AuctionController);
	server.bind(controller);

	server.route({
		method: "GET",
		path: "/auctions",
		handler: controller.index,
		options: {
			validate: {
				query: Joi.object({
					orderBy: server.app.schemas.orderBy,
					transform: Joi.bool().default(true),
					expired: Joi.bool().default(false),
				}).concat(Schemas.pagination),
			},
			plugins: {
				pagination: {
					enabled: true,
				},
			},
		},
	});

	server.route({
		method: "POST",
		path: "/auctions/search",
		handler: controller.search,
		options: {
			validate: {
				query: Joi.object({
					orderBy: server.app.schemas.orderBy,
					transform: Joi.bool().default(true),
					onlyActive: Joi.bool().default(false),
					expired: Joi.bool().default(false),
					includeBids: Joi.bool().default(false),
					canceledBids: Joi.bool().default(false),
				}).concat(Schemas.pagination),
				payload: Joi.object({
					senderPublicKey: Joi.string().hex().length(66).optional(),
					nftIds: Joi.array().items(Joi.string().hex().length(64)).optional(),
					startAmount: Joi.string().optional(),
					expiration: Joi.object({
						blockHeight: Joi.number().positive(),
					}),
				}),
			},
			plugins: {
				pagination: {
					enabled: true,
				},
			},
		},
	});

	changeRouteHandler(server, "get", "/api/nft/exchange/auctions", "/api/nft/indexer/auctions");
	changeRouteHandler(server, "post", "/api/nft/exchange/auctions/search", "/api/nft/indexer/auctions/search");
};
