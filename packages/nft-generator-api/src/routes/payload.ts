import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { PayloadController } from "../controllers/payload";

export const register = (server: Hapi.Server): void => {
	const controller = server.app.app.resolve(PayloadController);
	server.bind(controller);

	server.route({
		method: "GET",
		path: "/hello",
		handler: controller.hello,
		options: {},
	});

	server.route({
		method: "POST",
		path: "/payload/collection",
		handler: controller.generateTokenCollection,
		options: {
			validate: {
				query: Joi.object({
					apply: Joi.boolean(),
				}),
				payload: Joi.object({
					name: Joi.string().max(30),
					description: Joi.string().max(30),
					maximumSupply: Joi.number().positive(),
					nonce: Joi.number().optional().positive(),
					jsonSchema: Joi.any(),
					passphrase: Joi.string(),
				}),
			},
		},
	});

	server.route({
		method: "POST",
		path: "/payload/asset",
		handler: controller.generateTokenAsset,
		options: {
			validate: {
				query: Joi.object({
					apply: Joi.boolean(),
				}),
				payload: Joi.object({
					collectionId: Joi.string().hex().length(64),
					nonce: Joi.number().optional().positive(),
					attributes: Joi.any(),
					passphrase: Joi.string(),
				}),
			},
		},
	});

	server.route({
		method: "POST",
		path: "/payload/transfer",
		handler: controller.generateTokenTransfer,
		options: {
			validate: {
				query: Joi.object({
					apply: Joi.boolean(),
				}),
				payload: Joi.object({
					nftIds: Joi.array(),
					recipientId: Joi.string(),
					nonce: Joi.number().optional().positive(),
					passphrase: Joi.string(),
				}),
			},
		},
	});

	server.route({
		method: "POST",
		path: "/payload/burn",
		handler: controller.generateTokenBurn,
		options: {
			validate: {
				query: Joi.object({
					apply: Joi.boolean(),
				}),
				payload: Joi.object({
					nftId: Joi.string().hex().length(64),
					nonce: Joi.number().optional().positive(),
					passphrase: Joi.string(),
				}),
			},
		},
	});

	server.route({
		method: "POST",
		path: "/payload/auction",
		handler: controller.generateTokenAuction,
		options: {
			validate: {
				query: Joi.object({
					apply: Joi.boolean(),
				}),
				payload: Joi.object({
					nftIds: Joi.array(),
					startAmount: Joi.number().positive(),
					expiration: Joi.object({
						blockHeight: Joi.number().positive(),
					}),
					nonce: Joi.number().optional().positive(),
					passphrase: Joi.string(),
				}),
			},
		},
	});

	server.route({
		method: "POST",
		path: "/payload/auction/cancel",
		handler: controller.generateTokenAuctionCancel,
		options: {
			validate: {
				query: Joi.object({
					apply: Joi.boolean(),
				}),
				payload: Joi.object({
					auctionId: Joi.string().hex().length(64),
					nonce: Joi.number().optional().positive(),
					passphrase: Joi.string(),
				}),
			},
		},
	});

	server.route({
		method: "POST",
		path: "/payload/bid",
		handler: controller.generateTokenBid,
		options: {
			validate: {
				query: Joi.object({
					apply: Joi.boolean(),
				}),
				payload: Joi.object({
					auctionId: Joi.string().hex().length(64),
					bidAmount: Joi.number().positive(),
					nonce: Joi.number().optional().positive(),
					passphrase: Joi.string(),
				}),
			},
		},
	});

	server.route({
		method: "POST",
		path: "/payload/bid/cancel",
		handler: controller.generateTokenBidCancel,
		options: {
			validate: {
				query: Joi.object({
					apply: Joi.boolean(),
				}),
				payload: Joi.object({
					bidId: Joi.string().hex().length(64),
					nonce: Joi.number().optional().positive(),
					passphrase: Joi.string(),
				}),
			},
		},
	});

	server.route({
		method: "POST",
		path: "/payload/trade",
		handler: controller.generateTokenAcceptTrade,
		options: {
			validate: {
				query: Joi.object({
					apply: Joi.boolean(),
				}),
				payload: Joi.object({
					auctionId: Joi.string().hex().length(64),
					bidId: Joi.string().hex().length(64),
					nonce: Joi.number().optional().positive(),
					passphrase: Joi.string(),
				}),
			},
		},
	});
};
