import { Utils } from "@arkecosystem/crypto";
import { Column, Entity, ManyToOne } from "typeorm";

import { transformBigInt } from "../utils";
import { Auction } from "./auction";
import { BaseEntity } from "./base";

export enum BidStatusEnum {
	IN_PROGRESS = "IN_PROGRESS",
	FINISHED = "FINISHED",
	CANCELED = "CANCELED",
	ACCEPTED = "ACCEPTED",
}

@Entity({
	name: "bids",
})
export class Bid extends BaseEntity {
	@Column({
		type: "bigint",
		transformer: transformBigInt,
	})
	public bidAmount!: Utils.BigNumber;

	@Column({ type: "simple-enum", enum: BidStatusEnum })
	public status!: BidStatusEnum;

	@ManyToOne(() => Auction, (auction) => auction.bids)
	public auction!: Auction;
}
