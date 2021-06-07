import { Interfaces } from "@arkecosystem/crypto";
import { Interfaces as NFTExchangeInterfaces } from "@protokol/nft-exchange-crypto";
import { EntityRepository, getCustomRepository, Repository } from "typeorm";

import { Auction, AuctionStatusEnum } from "../entities";
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

		await this.insert(auction);
	}

	public async deleteAuction(transaction: Interfaces.ITransactionData): Promise<void> {
		const { id } = transaction;
		await this.delete(id!);
	}

	public async cancelAuction(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const auctionCancelAsset: NFTExchangeInterfaces.NFTAuctionCancel = asset!.nftAuctionCancel;
		await this.update(auctionCancelAsset.auctionId, { status: AuctionStatusEnum.CANCELED });
		await getCustomRepository(BidRepository).cancelBids(auctionCancelAsset.auctionId);
	}

	public async cancelAuctionRevert(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const auctionCancelAsset: NFTExchangeInterfaces.NFTAuctionCancel = asset!.nftAuctionCancel;
		await this.update(auctionCancelAsset.auctionId, { status: AuctionStatusEnum.IN_PROGRESS });
		await getCustomRepository(BidRepository).cancelBidsRevert(auctionCancelAsset.auctionId);
	}
}
