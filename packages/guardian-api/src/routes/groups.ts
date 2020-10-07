import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { GroupsController } from "../controllers/groups";
import { groupCriteriaQuerySchema, groupSortingSchema } from "../resources";

export const register = (server: Hapi.Server): void => {
	const controller = server.app.app.resolve(GroupsController);
	server.bind(controller);

	server.route({
		method: "GET",
		path: "/groups",
		handler: controller.index,
		options: {
			validate: {
				query: Joi.object()
					.concat(groupSortingSchema)
					.concat(groupCriteriaQuerySchema)
					.concat(Schemas.pagination),
			},
			plugins: {
				pagination: { enabled: true },
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
