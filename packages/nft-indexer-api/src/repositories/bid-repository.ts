import { Interfaces } from "@arkecosystem/crypto";
import { Interfaces as NFTExchangeInterfaces } from "@protokol/nft-exchange-crypto";
import { Brackets, EntityRepository, Repository } from "typeorm";

import { Auction, Bid, BidStatusEnum } from "../entities";

@EntityRepository(Bid)
export class BidRepository extends Repository<Bid> {
	public async insertBid(transaction: Interfaces.ITransactionData): Promise<void> {
		const { id, senderPublicKey, asset, blockId } = transaction;
		const bidAsset: NFTExchangeInterfaces.NFTBidAsset = asset!.nftBid;
		const bid = new Bid();
		bid.id = id!;
		bid.senderPublicKey = senderPublicKey!;
		bid.status = BidStatusEnum.IN_PROGRESS;
		bid.blockId = blockId!;
		bid.bidAmount = bidAsset.bidAmount;
		bid.auction = { id: bidAsset.auctionId } as Auction;

		await this.insert(bid);
	}

	public async deleteBid(transaction: Interfaces.ITransactionData): Promise<void> {
		const { id } = transaction;

		await this.delete(id!);
	}

	public async finishBids(auctionId: string): Promise<void> {
		await this.createQueryBuilder()
			.update()
			.set({ status: BidStatusEnum.FINISHED })
			.where("auctionId = :auctionId")
			.andWhere("status = :status")
			.setParameters({ auctionId, status: BidStatusEnum.IN_PROGRESS })
			.execute();
	}

	public async finishBidsRevert(auctionId: string): Promise<void> {
		await this.createQueryBuilder()
			.update()
			.set({ status: BidStatusEnum.IN_PROGRESS })
			.where("auctionId = :auctionId")
			.andWhere(
				new Brackets((qb) => {
					qb.where("status = :status1").orWhere("status = :status2");
				}),
			)
			.setParameters({ auctionId, status1: BidStatusEnum.FINISHED, status2: BidStatusEnum.ACCEPTED })
			.execute();
	}

	public async cancelBid(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const bidCancelAsset: NFTExchangeInterfaces.NFTBidCancelAsset = asset!.nftBidCancel;

		await this.update(bidCancelAsset.bidId, { status: BidStatusEnum.CANCELED });
	}

	public async cancelBidRevert(transaction: Interfaces.ITransactionData): Promise<void> {
		const { asset } = transaction;
		const bidCancelAsset: NFTExchangeInterfaces.NFTBidCancelAsset = asset!.nftBidCancel;

		await this.update(bidCancelAsset.bidId, { status: BidStatusEnum.IN_PROGRESS });
	}
}
