import { Interfaces } from "@arkecosystem/crypto";
import { Interfaces as NFTExchangeInterfaces } from "@protokol/nft-exchange-crypto";
import { EntityRepository, Repository } from "typeorm";

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
		bid.createdAt = new Date();
		bid.auction = { id: bidAsset.auctionId } as Auction;

		await this.insert(bid);
	}

	public async deleteBid(transaction: Interfaces.ITransactionData): Promise<void> {
		const { id } = transaction;
		await this.delete(id!);
	}
}
