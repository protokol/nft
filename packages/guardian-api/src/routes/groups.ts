import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { GroupsController } from "../controllers/groups";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(GroupsController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/groups",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.orderBy,
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/groups/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string(),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/groups/{id}/users",
        handler: controller.showUsers,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string(),
                }),
            },
        },
    });
};
