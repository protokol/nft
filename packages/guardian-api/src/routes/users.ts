import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { UsersController } from "../controllers/users";
import { userCriteriaQuerySchema } from "../resources";

export const register = (server: Hapi.Server): void => {
	const controller = server.app.app.resolve(UsersController);
	server.bind(controller);

	server.route({
		method: "GET",
		path: "/users",
		handler: controller.index,
		options: {
			validate: {
				query: Joi.object().concat(userCriteriaQuerySchema).concat(Schemas.pagination),
			},
			plugins: {
				pagination: { enabled: true },
			},
		},
	});

	server.route({
		method: "GET",
		path: "/users/{id}",
		handler: controller.show,
		options: {
			validate: {
				params: Joi.object({
					id: Joi.string().hex().length(66),
				}),
			},
		},
	});

	server.route({
		method: "GET",
		path: "/users/{id}/groups",
		handler: controller.showGroups,
		options: {
			validate: {
				params: Joi.object({
					id: Joi.string().hex().length(66),
				}),
			},
		},
	});
};
