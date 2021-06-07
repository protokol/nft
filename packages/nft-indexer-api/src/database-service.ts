import { Contracts } from "@arkecosystem/core-kernel";
import { Events } from "@protokol/nft-exchange-transactions";
import { Connection, createConnection } from "typeorm";

import { defaults } from "./defaults";
import { AuctionEvent, AuctionRevertEvent, BidEvent, BidRevertEvent } from "./events";

export class DatabaseService {
	constructor(private events: Contracts.Kernel.EventDispatcher, private connection?: Connection) {}

	public async initialize(): Promise<void> {
		await this.connect();
		await this.reset();
		this.setupListeners();
	}

	private async connect(): Promise<void> {
		this.connection = await createConnection({
			type: "better-sqlite3",
			database: defaults.dbFilename,
			entities: [__dirname + "/entities/*.js"],
		});
	}

	public async disconnect(): Promise<void> {
		await this.connection?.close();
	}

	private async reset(): Promise<void> {
		await this.connection?.synchronize(true);
	}

	private setupListeners(): void {
		this.events.listenMany([
			[Events.NFTExchangeApplicationEvents.NFTAuction, new AuctionEvent()],
			[Events.NFTExchangeApplicationEvents.NFTAuctionRevert, new AuctionRevertEvent()],
			[Events.NFTExchangeApplicationEvents.NFTBid, new BidEvent()],
			[Events.NFTExchangeApplicationEvents.NFTBidRevert, new BidRevertEvent()],
		]);
	}
}
