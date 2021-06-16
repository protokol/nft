import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "joi";

import { AuctionController } from "../controllers/auctions";

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
};
