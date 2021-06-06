import { Contracts } from "@arkecosystem/core-kernel";
import { getCustomRepository } from "typeorm";

import { AuctionRepository } from "./repositories/auction-repository";

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
