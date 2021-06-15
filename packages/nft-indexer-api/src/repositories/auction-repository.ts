import { Interfaces } from "@arkecosystem/crypto";
import { Interfaces as NFTExchangeInterfaces } from "@protokol/nft-exchange-crypto";
import { EntityRepository, getCustomRepository, Repository } from "typeorm";

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
}
