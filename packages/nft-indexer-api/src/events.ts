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
		await getCustomRepository(BidRepository).processCancelBid(payload.data);
	}
}

export class BidCancelRevertEvent implements Contracts.Kernel.EventListener {
	async handle(payload: { name: Contracts.Kernel.EventName; data: any }): Promise<void> {
		await getCustomRepository(BidRepository).processCancelBidRevert(payload.data);
	}
}
