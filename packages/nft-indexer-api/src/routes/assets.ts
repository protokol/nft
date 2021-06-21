import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "joi";

import { AssetController } from "../controllers/assets";
import { changeRouteHandler } from "../utils";

export const register = (server: Hapi.Server): void => {
	const controller = server.app.app.resolve(AssetController);
	server.bind(controller);

	server.route({
		method: "GET",
		path: "/assets/wallet/{id}",
		handler: controller.showWalletAssets,
		options: {
			validate: {
				query: Joi.object({
					orderBy: server.app.schemas.orderBy,
					transform: Joi.bool().default(true),
					inAuction: Joi.bool().default(false),
					inExpiredAuction: Joi.bool().default(false),
				}).concat(Schemas.pagination),
				params: Joi.object({
					id: Joi.string().hex().length(66),
				}),
			},
			plugins: {
				pagination: {
					enabled: true,
				},
			},
		},
	});

	changeRouteHandler(server, "get", "/api/nft/assets/wallet/{id}", "/api/nft/indexer/assets/wallet/{id}");
};
