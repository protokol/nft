import { Interfaces } from "@arkecosystem/crypto";
import { Interfaces as NFTExchangeInterfaces } from "@protokol/nft-exchange-crypto";
import { EntityRepository, getCustomRepository, Repository, SelectQueryBuilder } from "typeorm";

import { Auction, AuctionStatusEnum, BidStatusEnum } from "../entities";
import { AssetRepository } from "./asset-repository";
import { BidRepository } from "./bid-repository";

@EntityRepository(Auction)
export class AuctionRepository extends Repository<Auction> {
	public async insertAuction(transaction: Interfaces.ITransactionData): Promise<void> {
		const { id, senderPublicKey, asset, blockId } = transaction;
		const auctionAsset: NFTExchangeInterfaces.NFTAuctionAsset = asset!.nftAuction;
		const auction = new Auction();
		auction.id = id!;
		auction.senderPublicKey = senderPublicKey!;
		auction.status = AuctionStatusEnum.IN_PROGRESS;
		auction.nftIds = auctionAsset.nftIds;
		auction.expiration = auctionAsset.expiration.blockHeight;
		auction.blockId = blockId!;
		auction.startAmount = auctionAsset.startAmount;

		await this.createQueryBuilder().insert().values(auction).updateEntity(false).execute();
		await getCustomRepository(AssetRepository).addAuctionToAssets(auction.nftIds, id!);
	}

	public async deleteAuction(transaction: Interfaces.ITransactionData): Promise<void> {
		const { id } = transaction;

		await getCustomRepository(AssetRepository).removeAuctionFromAssets(id!);
		await this.delete(id!);
	}

	public async cancelAuction(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const auctionCancelAsset: NFTExchangeInterfaces.NFTAuctionCancel = asset!.nftAuctionCancel;

		await Promise.all([
			this.update(auctionCancelAsset.auctionId, { status: AuctionStatusEnum.CANCELED }),
			getCustomRepository(BidRepository).finishBids(auctionCancelAsset.auctionId),
			getCustomRepository(AssetRepository).removeAuctionFromAssets(auctionCancelAsset.auctionId),
		]);
	}

	public async cancelAuctionRevert(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const auctionCancelAsset: NFTExchangeInterfaces.NFTAuctionCancel = asset!.nftAuctionCancel;

		const auction = await this.findOneOrFail(auctionCancelAsset.auctionId);

		await Promise.all([
			this.update(auction.id, { status: AuctionStatusEnum.IN_PROGRESS }),
			getCustomRepository(BidRepository).finishBidsRevert(auction.id),
			getCustomRepository(AssetRepository).addAuctionToAssets(auction.nftIds, auction.id),
		]);
	}

	public async finishAuction(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const acceptTradeAsset: NFTExchangeInterfaces.NFTAcceptTradeAsset = asset!.nftAcceptTrade;

		const bid = await getCustomRepository(BidRepository).findOneOrFail(acceptTradeAsset.bidId);

		await Promise.all([
			this.update(acceptTradeAsset.auctionId, { status: AuctionStatusEnum.FINISHED }),
			await getCustomRepository(BidRepository).finishBids(acceptTradeAsset.auctionId),
			getCustomRepository(AssetRepository).transferAndRemoveAuctionFromAssets(
				acceptTradeAsset.auctionId,
				bid.senderPublicKey,
			),
		]);
		await getCustomRepository(BidRepository).update(acceptTradeAsset.bidId, { status: BidStatusEnum.ACCEPTED });
	}

	public async finishAuctionRevert(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const acceptTradeAsset: NFTExchangeInterfaces.NFTAcceptTradeAsset = asset!.nftAcceptTrade;

		const auction = await this.findOneOrFail(acceptTradeAsset.auctionId);

		await Promise.all([
			this.update(acceptTradeAsset.auctionId, { status: AuctionStatusEnum.IN_PROGRESS }),
			await getCustomRepository(BidRepository).finishBidsRevert(acceptTradeAsset.auctionId),
			getCustomRepository(AssetRepository).transferAndAddAuctionToAssets(
				auction.nftIds,
				auction.id,
				auction.senderPublicKey,
			),
		]);
	}

	public getAuctionsQuery(lastBlock: Interfaces.IBlock, expired: boolean): SelectQueryBuilder<Auction> {
		const query = this.createQueryBuilder("auction")
			.select()
			.where("status = :status", { status: AuctionStatusEnum.IN_PROGRESS });

		if (!expired) {
			query.andWhere("expiration > :expiration", { expiration: lastBlock.data.height });
		}

		return query;
	}

	public getSearchAuctionsQuery(
		lastBlock: Interfaces.IBlock,
		query: { onlyActive: boolean; expired: boolean; includeBids: boolean; canceledBids: boolean },
		payload: {
			senderPublicKey?: string;
			nftIds?: string[];
			startAmount?: string;
			expiration?: { blockHeight: number };
		},
	): SelectQueryBuilder<Auction> {
		const { onlyActive, expired, includeBids, canceledBids } = query;
		const { senderPublicKey, nftIds, startAmount, expiration } = payload;

		const aliasAuction = "auction";
		const searchQuery = this.createQueryBuilder(aliasAuction).select().where("1=1");

		if (onlyActive) {
			searchQuery.andWhere(`${aliasAuction}.status = :statusA`, { statusA: AuctionStatusEnum.IN_PROGRESS });
		}

		if (!expired) {
			searchQuery.andWhere("expiration > :expirationBT", { expirationBT: lastBlock.data.height });
		}

		if (includeBids) {
			const aliasBids = "bids";
			if (canceledBids) {
				searchQuery.leftJoinAndSelect(`${aliasAuction}.${aliasBids}`, aliasBids);
			} else {
				searchQuery.leftJoinAndSelect(
					`${aliasAuction}.${aliasBids}`,
					aliasBids,
					`${aliasBids}.status != :statusB`,
					{ statusB: BidStatusEnum.CANCELED },
				);
			}
		}

		if (senderPublicKey) {
			searchQuery.andWhere(`${aliasAuction}.senderPublicKey = :senderPublicKey`, { senderPublicKey });
		}

		if (startAmount) {
			searchQuery.andWhere("startAmount = :startAmount", { startAmount });
		}

		if (expiration) {
			searchQuery.andWhere("expiration = :expiration", { expiration: expiration.blockHeight });
		}

		if (nftIds?.length) {
			searchQuery.andWhere("nftIds = :nftIds", { nftIds: nftIds.toString() });
		}

		return searchQuery;
	}
}
