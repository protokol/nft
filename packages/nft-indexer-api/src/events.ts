import { Contracts } from "@arkecosystem/core-kernel";
import { getCustomRepository } from "typeorm";

import { AuctionRepository, BidRepository } from "./repositories";

export class AuctionEvent implements Contracts.Kernel.EventListener {
	async handle(payload: { name: Contracts.Kernel.EventName; data: any }): Promise<void> {
		await getCustomRepository(AuctionRepository).insertAuction(payload.data);
	}
}

export class AuctionRevertEvent implements Contracts.Kernel.EventListener {
	async handle(payload: { name: Contracts.Kernel.EventName; data: any }): Promise<void> {
		await getCustomRepository(AuctionRepository).deleteAuction(payload.data);
	}
}

export class AuctionCancelEvent implements Contracts.Kernel.EventListener {
	async handle(payload: { name: Contracts.Kernel.EventName; data: any }): Promise<void> {
		await getCustomRepository(AuctionRepository).cancelAuction(payload.data);
	}
}

export class AuctionCancelRevertEvent implements Contracts.Kernel.EventListener {
	async handle(payload: { name: Contracts.Kernel.EventName; data: any }): Promise<void> {
		await getCustomRepository(AuctionRepository).cancelAuctionRevert(payload.data);
	}
}

export class BidEvent implements Contracts.Kernel.EventListener {
	async handle(payload: { name: Contracts.Kernel.EventName; data: any }): Promise<void> {
		await getCustomRepository(BidRepository).insertBid(payload.data);
	}
}

export class BidRevertEvent implements Contracts.Kernel.EventListener {
	async handle(payload: { name: Contracts.Kernel.EventName; data: any }): Promise<void> {
		await getCustomRepository(BidRepository).deleteBid(payload.data);
	}
}

export class BidCancelEvent implements Contracts.Kernel.EventListener {
	async handle(payload: { name: Contracts.Kernel.EventName; data: any }): Promise<void> {
		await getCustomRepository(BidRepository).cancelBid(payload.data);
	}
}

export class BidCancelRevertEvent implements Contracts.Kernel.EventListener {
	async handle(payload: { name: Contracts.Kernel.EventName; data: any }): Promise<void> {
		await getCustomRepository(BidRepository).cancelBidRevert(payload.data);
	}
}
