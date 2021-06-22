import { Identifiers, Server } from "@arkecosystem/core-api";
import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { DatabaseService } from "./database-service";
import Handlers from "./handlers";
import { Identifiers as ApiIdentifiers } from "./identifiers";

const plugin = require("../package.json");

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		const logger: Contracts.Kernel.Logger = this.app.get(Container.Identifiers.LogService);
		logger.info(`Loading plugin: ${plugin.name} with version ${plugin.version}.`);

		this.app.bind(ApiIdentifiers.DatabaseService).to(DatabaseService);
		await this.app.get<DatabaseService>(ApiIdentifiers.DatabaseService).initialize();

		for (const identifier of [Identifiers.HTTP, Identifiers.HTTPS]) {
			if (this.app.isBound<Server>(identifier)) {
				await this.app.get<Server>(identifier).register({
					plugin: Handlers,
					routes: { prefix: "/api/nft/indexer" },
				});
			}
		}
	}

	public async dispose(): Promise<void> {
		await this.app.get<DatabaseService>(ApiIdentifiers.DatabaseService).disconnect();
	}
}
