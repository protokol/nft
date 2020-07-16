import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { BurnsController } from "../controllers/burns";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(BurnsController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/burns",
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
        path: "/burns/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().hex().length(64),
                }),
            },
        },
    });
};
