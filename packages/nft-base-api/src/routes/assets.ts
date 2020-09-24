import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { AssetsController } from "../controllers/assets";

export const register = (server: Hapi.Server): void => {
	const controller = server.app.app.resolve(AssetsController);
	server.bind(controller);

	server.route({
		method: "GET",
		path: "/assets",
		handler: controller.index,
		options: {
			validate: {
				query: Joi.object({
					orderBy: server.app.schemas.orderBy,
					transform: Joi.bool().default(true),
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
		method: "GET",
		path: "/assets/{id}",
		handler: controller.show,
		options: {
			validate: {
				query: Joi.object({
					transform: Joi.bool().default(true),
				}),
				params: Joi.object({
					id: Joi.string().hex().length(64),
				}),
			},
		},
	});

	server.route({
		method: "GET",
		path: "/assets/{id}/wallets",
		handler: controller.showAssetWallet,
		options: {
			validate: {
				params: Joi.object({
					id: Joi.string().hex().length(64),
				}),
			},
		},
	});

	server.route({
		method: "POST",
		path: "/assets/search",
		handler: controller.showByAsset,
		options: {
			validate: {
				query: Joi.object({
					orderBy: server.app.schemas.orderBy,
					transform: Joi.bool().default(true),
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
