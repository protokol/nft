import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { TradesController } from "../controllers/trades";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(TradesController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/trades",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        transform: Joi.bool().default(true),
                    },
                }),
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
        path: "/trades/{id}",
        handler: controller.show,
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
        path: "/trades/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.orderBy,
                }),
                payload: Joi.object({
                    senderPublicKey: Joi.string().hex().length(66).optional(),
                    auctionId: Joi.string().hex().length(64),
                    bidId: Joi.string().hex().length(64),
                }),
            },
            plugins: {
                pagination: {
                    enabled: true,
                },
            },
        },
    });
};
