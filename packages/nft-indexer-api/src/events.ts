import { Contracts } from "@arkecosystem/core-kernel";
import { getCustomRepository } from "typeorm";

import { AssetRepository, AuctionRepository, BidRepository } from "./repositories";

type handleType = (payload: { name: Contracts.Kernel.EventName; data: any }) => Promise<void>;

class Event implements Contracts.Kernel.EventListener {
	constructor(public handle: handleType) {}
}

export class EventFactory {
	private bidRepository = getCustomRepository(BidRepository);
	private assetRepository = getCustomRepository(AssetRepository);
	private auctionRepository = getCustomRepository(AuctionRepository);

	public auctionEvent(): Event {
		return new Event(async (payload) => await this.auctionRepository.insertAuction(payload.data));
	}

	public auctionRevertEvent(): Event {
		return new Event(async (payload) => await this.auctionRepository.deleteAuction(payload.data));
	}

	public auctionCancelEvent(): Event {
		return new Event(async (payload) => await this.auctionRepository.cancelAuction(payload.data));
	}

	public auctionCancelRevertEvent(): Event {
		return new Event(async (payload) => await this.auctionRepository.cancelAuctionRevert(payload.data));
	}

	public bidEvent(): Event {
		return new Event(async (payload) => await this.bidRepository.insertBid(payload.data));
	}

	public bidRevertEvent(): Event {
		return new Event(async (payload) => await this.bidRepository.deleteBid(payload.data));
	}

	public bidCancelEvent(): Event {
		return new Event(async (payload) => await this.bidRepository.cancelBid(payload.data));
	}

	public bidCancelRevertEvent(): Event {
		return new Event(async (payload) => await this.bidRepository.cancelBidRevert(payload.data));
	}

	public acceptTradeEvent(): Event {
		return new Event(async (payload) => await this.auctionRepository.finishAuction(payload.data));
	}

	public acceptTradeRevertEvent(): Event {
		return new Event(async (payload) => await this.auctionRepository.finishAuctionRevert(payload.data));
	}

	public createAssetEvent(): Event {
		return new Event(async (payload) => await this.assetRepository.createAsset(payload.data));
	}

	public createAssetRevertEvent(): Event {
		return new Event(async (payload) => await this.assetRepository.deleteAsset(payload.data));
	}

	public burnAssetEvent(): Event {
		return new Event(async (payload) => await this.assetRepository.burnAsset(payload.data));
	}

	public burnAssetRevertEvent(): Event {
		return new Event(async (payload) => await this.assetRepository.burnAssetRevert(payload.data));
	}

	public transferAssetEvent(): Event {
		return new Event(async (payload) => await this.assetRepository.transferAsset(payload.data));
	}

	public transferAssetRevertEvent(): Event {
		return new Event(async (payload) => await this.assetRepository.transferAssetRevert(payload.data));
	}
}
