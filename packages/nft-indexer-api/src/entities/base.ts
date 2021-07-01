import { BeforeInsert, Column, PrimaryColumn } from "typeorm";

export class BaseEntity {
	@PrimaryColumn({
		type: "varchar",
		length: 64,
	})
	public id!: string;

	@Column({
		type: "varchar",
		length: 64,
	})
	public blockId!: string;

	@Column({
		type: "datetime",
	})
	public createdAt!: Date;

	@BeforeInsert()
	private async setCreatedAt(): Promise<void> {
		this.createdAt = new Date();
	}
}
