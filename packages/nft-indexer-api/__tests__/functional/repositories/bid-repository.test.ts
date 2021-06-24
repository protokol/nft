import { passphrases } from "@arkecosystem/core-test-framework";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Builders as NFTExchangeBuilders } from "@protokol/nft-exchange-crypto";
import { Connection, getCustomRepository } from "typeorm";

import { AuctionStatusEnum, BidStatusEnum } from "../../../src/entities";
import { AuctionRepository, BidRepository } from "../../../src/repositories";
import { resetDb, setupAppAndGetConnection, tearDownAppAndcloseConnection } from "../__support__";

let connection: Connection | undefined;
let auctionRepository: AuctionRepository | undefined;
let bidRepository: BidRepository | undefined;
let bidAsset: Interfaces.ITransaction | undefined;
let cancelBidAsset: Interfaces.ITransaction | undefined;

const auctionId = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
const blockId = "blockId";

beforeAll(async () => {
	connection = await setupAppAndGetConnection();
	bidRepository = getCustomRepository(BidRepository);
	auctionRepository = getCustomRepository(AuctionRepository);

	bidAsset = new NFTExchangeBuilders.NFTBidBuilder()
		.NFTBidAsset({
			auctionId,
			bidAmount: Utils.BigNumber.ONE,
		})
		.nonce("1")
		.sign(passphrases[1]!)
		.build();

	cancelBidAsset = new NFTExchangeBuilders.NFTBidCancelBuilder()
		.NFTBidCancelAsset({
			bidId: bidAsset.id!,
		})
		.nonce("1")
		.sign(passphrases[1]!)
		.build();
});

beforeEach(async () => {
	await resetDb(connection!);
	await auctionRepository!.save({
		id: auctionId,
		blockId,
		createdAt: new Date(),
		senderPublicKey: "sender",
		nftIds: [],
		startAmount: 1,
		status: AuctionStatusEnum.IN_PROGRESS,
		expiration: 1,
	});
});

afterAll(async () => {
	await tearDownAppAndcloseConnection(connection!);
});

describe("Test Bid repository", () => {
	it("insertBid", async () => {
		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);

		const bid = await bidRepository!.findOne(bidAsset!.id, { relations: ["auction"] });

		expect(bid!.id).toBe(bidAsset!.id);
		expect(bid!.status).toBe(BidStatusEnum.IN_PROGRESS);
		expect(bid!.auction.id).toBe(auctionId);
	});

	it("deleteBid", async () => {
		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);
		const inserted = await bidRepository!.findOne(bidAsset!.id);

		await bidRepository!.deleteBid(bidAsset!.data);
		const deleted = await bidRepository!.findOne(bidAsset!.id);

		expect(inserted!.id).toBe(bidAsset!.id);
		expect(deleted).toBeUndefined();
	});

	it("cancelBid", async () => {
		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);
		await bidRepository!.cancelBid(cancelBidAsset!.data);

		const canceled = await bidRepository!.findOne(bidAsset!.id);

		expect(canceled!.id).toBe(bidAsset!.id);
		expect(canceled!.status).toBe(BidStatusEnum.CANCELED);
	});

	it("cancelBidRevert", async () => {
		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);
		await bidRepository!.cancelBid(cancelBidAsset!.data);
		const canceled = await bidRepository!.findOne(bidAsset!.id);
		await bidRepository!.cancelBidRevert(cancelBidAsset!.data);
		const uncanceled = await bidRepository!.findOne(bidAsset!.id);

		expect(canceled!.status).toBe(BidStatusEnum.CANCELED);
		expect(uncanceled!.status).toBe(BidStatusEnum.IN_PROGRESS);
	});

	it("finishBids", async () => {
		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);
		const inserted = await bidRepository!.findOne(bidAsset!.id);
		await bidRepository!.finishBids(auctionId);
		const finished = await bidRepository!.findOne(bidAsset!.id);

		expect(inserted!.status).toBe(BidStatusEnum.IN_PROGRESS);
		expect(finished!.status).toBe(BidStatusEnum.FINISHED);
	});

	it("finishBidsRevert", async () => {
		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);
		await bidRepository!.finishBids(auctionId);
		const finished = await bidRepository!.findOne(bidAsset!.id);
		await bidRepository!.finishBidsRevert(auctionId);
		const unfinished = await bidRepository!.findOne(bidAsset!.id);

		expect(finished!.status).toBe(BidStatusEnum.FINISHED);
		expect(unfinished!.status).toBe(BidStatusEnum.IN_PROGRESS);
	});
});
