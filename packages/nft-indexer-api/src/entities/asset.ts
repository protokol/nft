import { Column, Entity, ManyToOne } from "typeorm";

import { Auction } from "./auction";
import { BaseEntity } from "./base";

@Entity({
	name: "assets",
})
export class Asset extends BaseEntity {
	@Column({
		type: "varchar",
		length: 66,
	})
	public owner!: string;

	@Column({
		type: "varchar",
		length: 64,
	})
	public collectionId!: string;

	@Column("simple-json")
	public attributes!: object;

	@ManyToOne(() => Auction, (auction) => auction.assets)
	public auction!: Auction;

	@Column({ default: false })
	public isBurned!: boolean;
}
