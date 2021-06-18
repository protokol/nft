import { Interfaces } from "@arkecosystem/crypto";
import { Interfaces as NFTBaseInterfaces } from "@protokol/nft-base-crypto";
import { EntityRepository, Repository, SelectQueryBuilder } from "typeorm";

import { Asset } from "../entities";

interface TransactionData extends Interfaces.ITransactionData {
	owner: string;
}

@EntityRepository(Asset)
export class AssetRepository extends Repository<Asset> {
	public async createAsset(transaction: TransactionData): Promise<void> {
		const { id, owner, asset: txAsset, blockId } = transaction;
		const nftToken: NFTBaseInterfaces.NFTTokenAsset = txAsset!.nftToken;
		const asset = new Asset();
		asset.id = id!;
		asset.owner = owner;
		asset.collectionId = nftToken.collectionId;
		asset.attributes = nftToken.attributes;
		asset.blockId = blockId!;

		await this.createQueryBuilder().insert().values(asset).updateEntity(false).execute();
	}

	public async deleteAsset(transaction: TransactionData): Promise<void> {
		const { id } = transaction;

		await this.delete(id!);
	}

	public async burnAsset(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const burnAsset: NFTBaseInterfaces.NFTBurnAsset = asset!.nftBurn;

		await this.update(burnAsset.nftId, { isBurned: true });
	}

	public async burnAssetRevert(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const burnAsset: NFTBaseInterfaces.NFTBurnAsset = asset!.nftBurn;

		await this.update(burnAsset.nftId, { isBurned: false });
	}

	public async transferAsset(transaction: TransactionData): Promise<void> {
		const { owner, asset } = transaction;
		const transferAsset: NFTBaseInterfaces.NFTTransferAsset = asset!.nftTransfer;

		await this.update(transferAsset.nftIds, { owner });
	}

	public async transferAssetRevert(transaction: TransactionData): Promise<void> {
		const { senderPublicKey, asset } = transaction;
		const transferAsset: NFTBaseInterfaces.NFTTransferAsset = asset!.nftTransfer;

		await this.update(transferAsset.nftIds, { owner: senderPublicKey });
	}

	public async addAuctionToAssets(ids: string[], auctionId: string): Promise<void> {
		await this.update(ids, { auction: { id: auctionId } });
	}

	public async removeAuctionFromAssets(auctionId: string): Promise<void> {
		await this.update({ auction: { id: auctionId } }, { auction: { id: undefined } });
	}

	public async transferAndRemoveAuctionFromAssets(auctionId: string, owner: string): Promise<void> {
		await this.update({ auction: { id: auctionId } }, { auction: { id: undefined }, owner });
	}

	public async transferAndAddAuctionToAssets(ids: string[], auctionId: string, owner: string): Promise<void> {
		await this.update(ids, { auction: { id: auctionId }, owner });
	}

	public getAssetsQuery(
		owner: string,
		inAuction: boolean,
		inExpiredAuction: boolean,
		lastBlock: Interfaces.IBlock,
	): SelectQueryBuilder<Asset> {
		const aliasAsset = "asset";
		const query = this.createQueryBuilder(aliasAsset)
			.select()
			.where("isBurned = false")
			.andWhere("owner = :owner", { owner });

		if (inAuction) {
			if (inExpiredAuction) {
				query.andWhere("auctionId IS NOT NULL");
			} else {
				const aliasAuction = "auction";
				query.innerJoin(
					`${aliasAsset}.${aliasAuction}`,
					aliasAuction,
					`${aliasAuction}.expiration > :expiration`,
					{ expiration: lastBlock.data.height },
				);
			}
		}

		return query;
	}
}
