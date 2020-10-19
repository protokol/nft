import Hapi from "@hapi/hapi";

import { ConfigurationsController } from "../controllers/configurations";

export const register = (server: Hapi.Server): void => {
	const controller = server.app.app.resolve(ConfigurationsController);
	server.bind(controller);

	server.route({
		method: "GET",
		path: "/configurations",
		handler: controller.index,
		options: {},
	});
};
