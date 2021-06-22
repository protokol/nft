import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Events as BaseEvents } from "@protokol/nft-base-transactions";
import { Events as ExchangeEvents } from "@protokol/nft-exchange-transactions";
import { Connection, createConnection } from "typeorm";

import { EventFactory } from "./events";

const pluginName = require("../package.json").name;

@Container.injectable()
export class DatabaseService {
	@Container.inject(Container.Identifiers.PluginConfiguration)
	@Container.tagged("plugin", pluginName)
	protected readonly configuration!: Providers.PluginConfiguration;

	@Container.inject(Container.Identifiers.EventDispatcherService)
	private events!: Contracts.Kernel.EventDispatcher;

	private connection?: Connection;

	public async initialize(): Promise<void> {
		await this.connect();
		await this.reset();
		this.setupListeners();
	}

	private async connect(): Promise<void> {
		this.connection = await createConnection({
			type: "better-sqlite3",
			database: this.configuration.get<string>("dbFilename")!,
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
		const eventFactory = new EventFactory();
		this.events.listenMany([
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTAuction, eventFactory.auctionEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTAuctionRevert, eventFactory.auctionRevertEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTBid, eventFactory.bidEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTBidRevert, eventFactory.bidRevertEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTCancelBid, eventFactory.bidCancelEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTCancelBidRevert, eventFactory.bidCancelRevertEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTCancelAuction, eventFactory.auctionCancelEvent()],
			[
				ExchangeEvents.NFTExchangeApplicationEvents.NFTCancelAuctionRevert,
				eventFactory.auctionCancelRevertEvent(),
			],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTAcceptTrade, eventFactory.acceptTradeEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTAcceptTradeRevert, eventFactory.acceptTradeRevertEvent()],
			[BaseEvents.NFTApplicationEvents.NFTCreate, eventFactory.createAssetEvent()],
			[BaseEvents.NFTApplicationEvents.NFTCreateRevert, eventFactory.createAssetRevertEvent()],
			[BaseEvents.NFTApplicationEvents.NFTBurn, eventFactory.burnAssetEvent()],
			[BaseEvents.NFTApplicationEvents.NFTBurnRevert, eventFactory.burnAssetRevertEvent()],
			[BaseEvents.NFTApplicationEvents.NFTTransfer, eventFactory.transferAssetEvent()],
			[BaseEvents.NFTApplicationEvents.NFTTransferRevert, eventFactory.transferAssetRevertEvent()],
		]);
	}
}
