import { passphrases } from "@arkecosystem/core-test-framework";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Builders as NFTBuilders } from "@protokol/nft-base-crypto";
import { Builders as NFTExchangeBuilders } from "@protokol/nft-exchange-crypto";
import { assert } from "console";
import { Connection, getCustomRepository } from "typeorm";

import { AuctionStatusEnum, BidStatusEnum } from "../../../src/entities";
import { AssetRepository, AuctionRepository, BidRepository } from "../../../src/repositories";
import { resetDb, setupAppAndGetConnection, tearDownAppAndcloseConnection } from "../__support__";

let connection: Connection | undefined;
let assetRepository: AssetRepository | undefined;
let auctionRepository: AuctionRepository | undefined;
let bidRepository: BidRepository | undefined;
let createAsset: Interfaces.ITransaction | undefined;
let auctionAsset: Interfaces.ITransaction | undefined;
let cancelAuctionAsset: Interfaces.ITransaction | undefined;
let acceptTradeAsset: Interfaces.ITransaction | undefined;
let bidAsset: Interfaces.ITransaction | undefined;

const collectionId = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
const blockId = "blockId";

beforeAll(async () => {
	connection = await setupAppAndGetConnection();
	assetRepository = getCustomRepository(AssetRepository);
	auctionRepository = getCustomRepository(AuctionRepository);
	bidRepository = getCustomRepository(BidRepository);

	createAsset = new NFTBuilders.NFTCreateBuilder()
		.NFTCreateToken({
			collectionId,
			attributes: { name: "name" },
		})
		.nonce("1")
		.sign(passphrases[0]!)
		.build();

	auctionAsset = new NFTExchangeBuilders.NFTAuctionBuilder()
		.NFTAuctionAsset({
			expiration: { blockHeight: 10 },
			startAmount: Utils.BigNumber.ONE,
			nftIds: [createAsset.id!],
		})
		.nonce("1")
		.sign(passphrases[0]!)
		.build();

	cancelAuctionAsset = new NFTExchangeBuilders.NFTAuctionCancelBuilder()
		.NFTAuctionCancelAsset({
			auctionId: auctionAsset.id!,
		})
		.nonce("1")
		.sign(passphrases[0]!)
		.build();

	bidAsset = new NFTExchangeBuilders.NFTBidBuilder()
		.NFTBidAsset({
			auctionId: auctionAsset.id!,
			bidAmount: Utils.BigNumber.ONE,
		})
		.nonce("1")
		.sign(passphrases[1]!)
		.build();

	acceptTradeAsset = new NFTExchangeBuilders.NftAcceptTradeBuilder()
		.NFTAcceptTradeAsset({
			auctionId: auctionAsset.id!,
			bidId: bidAsset.id!,
		})
		.nonce("1")
		.sign(passphrases[0]!)
		.build();
});

beforeEach(async () => {
	await resetDb(connection!);
	const assetData = { ...createAsset!.data, blockId, owner: "owner" };
	await assetRepository!.createAsset(assetData);
});

afterAll(async () => {
	await tearDownAppAndcloseConnection(connection!);
});

describe("Test Auction repository", () => {
	it("insertAuction", async () => {
		const auctionData = { ...auctionAsset!.data, blockId };
		await auctionRepository!.insertAuction(auctionData);

		const auction = await auctionRepository!.findOne(auctionAsset!.id);
		const asset = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });

		expect(auction!.id).toBe(auctionAsset!.id);
		expect(auction!.status).toBe(AuctionStatusEnum.IN_PROGRESS);
		expect(asset!.auction.id).toBe(auction!.id);
	});

	it("deleteAuction", async () => {
		const auctionData = { ...auctionAsset!.data, blockId };
		await auctionRepository!.insertAuction(auctionData);
		const inserted = await auctionRepository!.findOne(auctionAsset!.id);
		await auctionRepository!.deleteAuction(auctionAsset!.data);
		const deleted = await auctionRepository!.findOne(auctionAsset!.id);
		const asset = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });

		expect(inserted!.id).toBe(auctionAsset!.id);
		expect(deleted).toBeUndefined();
		expect(asset!.auction).toBeNull();
	});

	it("cancelAuction", async () => {
		const auctionData = { ...auctionAsset!.data, blockId };
		await auctionRepository!.insertAuction(auctionData);
		const inserted = await auctionRepository!.findOne(auctionAsset!.id);

		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);

		await auctionRepository!.cancelAuction(cancelAuctionAsset!.data);
		const canceled = await auctionRepository!.findOne(auctionAsset!.id);
		const asset = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });
		const bid = await bidRepository!.findOne(bidAsset!.id);

		expect(inserted!.status).toBe(AuctionStatusEnum.IN_PROGRESS);
		expect(canceled!.status).toBe(AuctionStatusEnum.CANCELED);
		expect(asset!.auction).toBeNull();
		expect(bid!.status).toBe(BidStatusEnum.FINISHED);
	});

	it("cancelAuctionRevert", async () => {
		const auctionData = { ...auctionAsset!.data, blockId };
		await auctionRepository!.insertAuction(auctionData);
		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);
		await auctionRepository!.cancelAuction(cancelAuctionAsset!.data);
		const canceled = await auctionRepository!.findOne(auctionAsset!.id);

		await auctionRepository!.cancelAuctionRevert(cancelAuctionAsset!.data);
		const reverted = await auctionRepository!.findOne(auctionAsset!.id);
		const asset = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });
		const bid = await bidRepository!.findOne(bidAsset!.id);

		expect(canceled!.status).toBe(AuctionStatusEnum.CANCELED);
		expect(reverted!.status).toBe(AuctionStatusEnum.IN_PROGRESS);
		expect(asset!.auction.id).toBe(canceled!.id);
		expect(bid!.status).toBe(BidStatusEnum.IN_PROGRESS);
	});

	it("finishAuction", async () => {
		const auctionData = { ...auctionAsset!.data, blockId };
		await auctionRepository!.insertAuction(auctionData);
		const inserted = await auctionRepository!.findOne(auctionAsset!.id);

		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);

		await auctionRepository!.finishAuction(acceptTradeAsset!.data);
		const finished = await auctionRepository!.findOne(auctionAsset!.id);
		const asset = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });
		const bid = await bidRepository!.findOne(bidAsset!.id);

		expect(inserted!.status).toBe(AuctionStatusEnum.IN_PROGRESS);
		expect(finished!.status).toBe(AuctionStatusEnum.FINISHED);
		expect(asset!.auction).toBeNull();
		expect(asset!.owner).toBe(bid!.senderPublicKey);
		expect(bid!.status).toBe(BidStatusEnum.ACCEPTED);
	});

	it("finishAuctionRevert", async () => {
		const auctionData = { ...auctionAsset!.data, blockId };
		await auctionRepository!.insertAuction(auctionData);

		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);

		await auctionRepository!.finishAuction(acceptTradeAsset!.data);
		const finished = await auctionRepository!.findOne(auctionAsset!.id);
		const asset = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });
		const bid = await bidRepository!.findOne(bidAsset!.id);

		await auctionRepository!.finishAuctionRevert(acceptTradeAsset!.data);
		const reverted = await auctionRepository!.findOne(auctionAsset!.id);
		const assetReverted = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });
		const bidReverted = await bidRepository!.findOne(bidAsset!.id);

		expect(finished!.status).toBe(AuctionStatusEnum.FINISHED);
		expect(reverted!.status).toBe(AuctionStatusEnum.IN_PROGRESS);
		expect(asset!.auction).toBeNull();
		expect(assetReverted!.auction.id).toBe(auctionAsset!.id!);
		expect(asset!.owner).toBe(bid!.senderPublicKey);
		expect(assetReverted!.owner).toBe(auctionAsset!.data.senderPublicKey);
		expect(bid!.status).toBe(BidStatusEnum.ACCEPTED);
		expect(bidReverted!.status).toBe(BidStatusEnum.IN_PROGRESS);
	});

	it("getAuctionsQuery", async () => {
		const auctionData = { ...auctionAsset!.data, blockId };
		await auctionRepository!.insertAuction(auctionData);

		const auctionAsset2 = new NFTExchangeBuilders.NFTAuctionBuilder()
			.NFTAuctionAsset({
				expiration: { blockHeight: 5 },
				startAmount: Utils.BigNumber.ONE,
				nftIds: [createAsset!.id!],
			})
			.nonce("2")
			.sign(passphrases[0]!)
			.build();
		const auctionData2 = { ...auctionAsset2.data, blockId };
		await auctionRepository!.insertAuction(auctionData2);

		const auctionAsset3 = new NFTExchangeBuilders.NFTAuctionBuilder()
			.NFTAuctionAsset({
				expiration: { blockHeight: 50 },
				startAmount: Utils.BigNumber.ONE,
				nftIds: [createAsset!.id!],
			})
			.nonce("3")
			.sign(passphrases[0]!)
			.build();
		const auctionData3 = { ...auctionAsset3.data, blockId };
		await auctionRepository!.insertAuction(auctionData3);

		const auctions = await auctionRepository!
			.getAuctionsQuery(
				{
					data: { height: 5 },
				} as Interfaces.IBlock,
				false,
			)
			.getMany();

		const withExpiredAuctions = await auctionRepository!
			.getAuctionsQuery(
				{
					data: { height: 5 },
				} as Interfaces.IBlock,
				true,
			)
			.getMany();

		expect(auctions.length).toBe(2);
		expect(withExpiredAuctions.length).toBe(3);
		expect(withExpiredAuctions.filter((x) => x.status === AuctionStatusEnum.EXPIRED).length).toBe(1);
	});

	it("getSearchAuctionsQuery", async () => {
		const auctionData = { ...auctionAsset!.data, blockId };
		await auctionRepository!.insertAuction(auctionData);

		const auctionAsset2 = new NFTExchangeBuilders.NFTAuctionBuilder()
			.NFTAuctionAsset({
				expiration: { blockHeight: 5 },
				startAmount: Utils.BigNumber.ONE,
				nftIds: [createAsset!.id!, collectionId],
			})
			.nonce("2")
			.sign(passphrases[1]!)
			.build();
		const auctionData2 = { ...auctionAsset2.data, blockId };
		await auctionRepository!.insertAuction(auctionData2);

		const auctionAsset3 = new NFTExchangeBuilders.NFTAuctionBuilder()
			.NFTAuctionAsset({
				expiration: { blockHeight: 50 },
				startAmount: Utils.BigNumber.make("2"),
				nftIds: [createAsset!.id!],
			})
			.nonce("3")
			.sign(passphrases[2]!)
			.build();
		const auctionData3 = { ...auctionAsset3.data, blockId };
		await auctionRepository!.insertAuction(auctionData3);
		await auctionRepository!.update({ id: auctionAsset3.id }, { status: AuctionStatusEnum.FINISHED });
		const bidData = { ...bidAsset!.data, blockId };
		await bidRepository!.insertBid(bidData);
		await bidRepository!.update({ id: bidAsset!.id! }, { status: BidStatusEnum.CANCELED });

		const auctions = await auctionRepository!
			.getSearchAuctionsQuery(
				{
					data: { height: 1 },
				} as Interfaces.IBlock,
				{ onlyActive: false, expired: false, includeBids: false, canceledBids: false },
				{},
			)
			.getMany();

		const onlyActiveAuctions = await auctionRepository!
			.getSearchAuctionsQuery(
				{
					data: { height: 5 },
				} as Interfaces.IBlock,
				{ onlyActive: true, expired: false, includeBids: false, canceledBids: false },
				{},
			)
			.getMany();

		const onlyActiveAndExpiredAuctions = await auctionRepository!
			.getSearchAuctionsQuery(
				{
					data: { height: 5 },
				} as Interfaces.IBlock,
				{ onlyActive: true, expired: true, includeBids: false, canceledBids: false },
				{},
			)
			.getMany();

		const filterByOwner = await auctionRepository!
			.getSearchAuctionsQuery(
				{
					data: { height: 1 },
				} as Interfaces.IBlock,
				{ onlyActive: false, expired: true, includeBids: false, canceledBids: false },
				{ senderPublicKey: auctionAsset3.data.senderPublicKey },
			)
			.getMany();

		const filterByAmount = await auctionRepository!
			.getSearchAuctionsQuery(
				{
					data: { height: 1 },
				} as Interfaces.IBlock,
				{ onlyActive: false, expired: true, includeBids: false, canceledBids: false },
				{ startAmount: "2" },
			)
			.getMany();

		const filterByExpiration = await auctionRepository!
			.getSearchAuctionsQuery(
				{
					data: { height: 1 },
				} as Interfaces.IBlock,
				{ onlyActive: false, expired: true, includeBids: false, canceledBids: false },
				{ expiration: { blockHeight: 50 } },
			)
			.getMany();

		const filterByNftIds = await auctionRepository!
			.getSearchAuctionsQuery(
				{
					data: { height: 1 },
				} as Interfaces.IBlock,
				{ onlyActive: false, expired: true, includeBids: false, canceledBids: false },
				{ nftIds: [createAsset!.id!, collectionId] },
			)
			.getMany();

		const withBids = await auctionRepository!
			.getSearchAuctionsQuery(
				{
					data: { height: 1 },
				} as Interfaces.IBlock,
				{ onlyActive: false, expired: true, includeBids: true, canceledBids: false },
				{ senderPublicKey: auctionAsset!.data.senderPublicKey },
			)
			.getMany();

		const withCanceledBids = await auctionRepository!
			.getSearchAuctionsQuery(
				{
					data: { height: 1 },
				} as Interfaces.IBlock,
				{ onlyActive: false, expired: true, includeBids: true, canceledBids: true },
				{ senderPublicKey: auctionAsset!.data.senderPublicKey },
			)
			.getMany();

		expect(auctions.length).toBe(3);
		expect(onlyActiveAuctions.length).toBe(1);
		expect(onlyActiveAndExpiredAuctions.length).toBe(2);

		expect(filterByOwner.length).toBe(1);
		expect(filterByOwner[0]!.id).toBe(auctionAsset3.id!);

		expect(filterByAmount.length).toBe(1);
		expect(filterByAmount[0]!.id).toBe(auctionAsset3.id!);

		expect(filterByExpiration.length).toBe(1);
		expect(filterByExpiration[0]!.id).toBe(auctionAsset3.id!);

		expect(filterByNftIds.length).toBe(1);
		expect(filterByNftIds[0]!.id).toBe(auctionAsset2.id!);

		expect(withBids.length).toBe(1);
		expect(withBids[0]!.bids.length).toBe(0);

		expect(withCanceledBids.length).toBe(1);
		expect(withCanceledBids[0]!.bids[0]!.id).toBe(bidAsset!.id!);
	});
});
