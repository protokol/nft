import { Column, Entity, OneToMany } from "typeorm";
import { Utils } from "@arkecosystem/crypto";

import { transformBigInt } from "../utils";
import { BaseEntity } from "./base";
import { Bid } from "./bid";
import { Asset } from "./asset";

export enum AuctionStatusEnum {
	IN_PROGRESS = "IN_PROGRESS",
	FINISHED = "FINISHED",
	CANCELED = "CANCELED",
}

@Entity({
	name: "auctions",
})
export class Auction extends BaseEntity {
	@Column({
		type: "varchar",
		length: 66,
	})
	public senderPublicKey!: string;

	@Column("simple-array")
	public nftIds!: string[];

	@Column({
		type: "bigint",
		transformer: transformBigInt,
	})
	public startAmount!: Utils.BigNumber;

	@Column("integer")
	public expiration!: number;

	@Column({ type: "simple-enum", enum: AuctionStatusEnum })
	public status!: AuctionStatusEnum;

	@OneToMany(() => Bid, (bid) => bid.auction)
	public bids!: Bid[];

	@OneToMany(() => Asset, (asset) => asset.auction)
	public assets!: Asset[];
}
