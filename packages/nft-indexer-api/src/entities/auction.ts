import { Column, Entity, PrimaryColumn } from "typeorm";
import { Utils } from "@arkecosystem/crypto";

import { transformBigInt } from "../utils";

export enum StatusEnum {
	IN_PROGRESS,
	FINISHED,
	CANCELED,
}

@Entity({
	name: "auctions",
})
export class Auction {
	@PrimaryColumn({
		type: "varchar",
		length: 64,
	})
	public id!: string;

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

	@Column({
		type: "integer",
	})
	public expiration!: number;

	@Column({ type: "simple-enum", enum: StatusEnum })
	public status!: StatusEnum;

	@Column({
		type: "varchar",
		length: 64,
	})
	public blockId!: string;
}
