import { Contracts } from "@arkecosystem/core-kernel";
import { Events as BaseEvents } from "@protokol/nft-base-transactions";
import { Events as ExchangeEvents } from "@protokol/nft-exchange-transactions";
import { Connection, createConnection } from "typeorm";

import { defaults } from "./defaults";
import {
	AcceptTradeEvent,
	AcceptTradeRevertEvent,
	AuctionCancelEvent,
	AuctionCancelRevertEvent,
	AuctionEvent,
	AuctionRevertEvent,
	BidCancelEvent,
	BidCancelRevertEvent,
	BidEvent,
	BidRevertEvent,
	BurnAssetEvent,
	BurnAssetRevertEvent,
	CreateAssetEvent,
	CreateAssetRevertEvent,
	TransferAssetEvent,
	TransferAssetRevertEvent,
} from "./events";

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
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTAuction, new AuctionEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTAuctionRevert, new AuctionRevertEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTBid, new BidEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTBidRevert, new BidRevertEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTCancelBid, new BidCancelEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTCancelBidRevert, new BidCancelRevertEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTCancelAuction, new AuctionCancelEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTCancelAuctionRevert, new AuctionCancelRevertEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTAcceptTrade, new AcceptTradeEvent()],
			[ExchangeEvents.NFTExchangeApplicationEvents.NFTAcceptTradeRevert, new AcceptTradeRevertEvent()],
			[BaseEvents.NFTApplicationEvents.NFTCreate, new CreateAssetEvent()],
			[BaseEvents.NFTApplicationEvents.NFTCreateRevert, new CreateAssetRevertEvent()],
			[BaseEvents.NFTApplicationEvents.NFTBurn, new BurnAssetEvent()],
			[BaseEvents.NFTApplicationEvents.NFTBurnRevert, new BurnAssetRevertEvent()],
			[BaseEvents.NFTApplicationEvents.NFTTransfer, new TransferAssetEvent()],
			[BaseEvents.NFTApplicationEvents.NFTTransferRevert, new TransferAssetRevertEvent()],
		]);
	}
}
