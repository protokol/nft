import Hapi from "@hapi/hapi";

import { ConfigurationController } from "../controllers/configurations";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(ConfigurationController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/configurations",
        handler: controller.index,
        options: {},
    });
};
