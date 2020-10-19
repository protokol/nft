import { Server } from "@arkecosystem/core-api";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Errors } from "@protokol/guardian-transactions";

import * as Configurations from "./routes/configurations";
import * as Groups from "./routes/groups";
import * as Users from "./routes/users";

export const Handler = {
	async register(server: Hapi.Server): Promise<void> {
		Configurations.register(server);
		Users.register(server);
		Groups.register(server);
	},
	name: "Guardian Api",
	version: "1.0.0",
};

export const initForbiddenErrorHandler = (server: Server): void => {
	const route = server.getRoute("POST", "/api/transactions");
	if (!route) return;

	const originalHandler = route.settings.handler.bind(route.settings.bind);
	route.settings.handler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
		try {
			return await originalHandler(request, h);
		} catch (err) {
			if (err instanceof Errors.WalletDoesntHavePermissionsError) {
				return Boom.forbidden(`Sending of ${err.type}/${err.group!} not allowed for this sender`);
			}

			throw err;
		}
	};
};
