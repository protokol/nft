import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Connection, createConnection } from "typeorm";

import { defaults } from "./defaults";

export class DatabaseService {
	private connection: Connection | undefined;

	@Container.inject(Container.Identifiers.EventDispatcherService)
	private readonly events!: Contracts.Kernel.EventDispatcher;

	public async initialize(): Promise<void> {
		await this.connect();
		// TODO setup events
	}

	private async connect(): Promise<void> {
		this.connection = await createConnection({
			type: "better-sqlite3",
			database: defaults.dbFilename,
			entities: [__dirname + "/entities/*.js"],
			synchronize: true,
		});
	}

	public async disconnect(): Promise<void> {
		await this.connection!.close();
	}

	private async reset(): Promise<void> {
		await this.connection!.query("DROP TABLE auctions;");
	}
}
