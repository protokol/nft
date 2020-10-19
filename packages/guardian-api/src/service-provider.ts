import { Identifiers as ApiIdentifiers, Server } from "@arkecosystem/core-api";
import { Providers } from "@arkecosystem/core-kernel";

import { Handler, initForbiddenErrorHandler } from "./handlers";
import { Identifiers } from "./identifiers";
import { GroupSearchService, UserSearchService } from "./services";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		this.app.bind(Identifiers.GroupSearchService).to(GroupSearchService);
		this.app.bind(Identifiers.UserSearchService).to(UserSearchService);

		for (const identifier of [ApiIdentifiers.HTTP, ApiIdentifiers.HTTPS]) {
			if (this.app.isBound<Server>(identifier)) {
				const server = this.app.get<Server>(identifier);
				await server.register({
					plugin: Handler,
					routes: { prefix: "/api/guardian" },
				});
				initForbiddenErrorHandler(server);
			}
		}
	}
}
