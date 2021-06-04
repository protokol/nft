import { Identifiers, Server } from "@arkecosystem/core-api";
import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { DatabaseService } from "./database-service";
import Handlers from "./handlers";

const plugin = require("../package.json");

export class ServiceProvider extends Providers.ServiceProvider {
	private databaseService: DatabaseService | undefined;

	public async register(): Promise<void> {
		const logger: Contracts.Kernel.Logger = this.app.get(Container.Identifiers.LogService);
		logger.info(`Loading plugin: ${plugin.name} with version ${plugin.version}.`);

		this.databaseService = new DatabaseService(
			this.app.get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService),
		);
		await this.databaseService.initialize();

		for (const identifier of [Identifiers.HTTP, Identifiers.HTTPS]) {
			if (this.app.isBound<Server>(identifier)) {
				await this.app.get<Server>(identifier).register({
					plugin: Handlers,
					routes: { prefix: "/api/nft-indexer" },
				});
			}
		}
	}

	public async dispose(): Promise<void> {
		await this.databaseService?.disconnect();
	}
}
