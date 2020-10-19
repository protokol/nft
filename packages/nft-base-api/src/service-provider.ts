import { Identifiers, Server } from "@arkecosystem/core-api";
import { Providers } from "@arkecosystem/core-kernel";

import Handlers from "./handlers";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		for (const identifier of [Identifiers.HTTP, Identifiers.HTTPS]) {
			if (this.app.isBound<Server>(identifier)) {
				await this.app.get<Server>(identifier).register({
					plugin: Handlers,
					routes: { prefix: "/api/nft" },
				});
			}
		}
	}
}
