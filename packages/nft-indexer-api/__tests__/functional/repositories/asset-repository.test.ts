import { passphrases } from "@arkecosystem/core-test-framework";
import { Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import { Builders as NFTBuilders } from "@protokol/nft-base-crypto";
import { Connection, getCustomRepository } from "typeorm";

import { AuctionStatusEnum } from "../../../src/entities";
import { AssetRepository, AuctionRepository } from "../../../src/repositories";
import { resetDb, setupAppAndGetConnection, tearDownAppAndcloseConnection } from "../__support__";

let connection: Connection | undefined;
let assetRepository: AssetRepository | undefined;
let auctionRepository: AuctionRepository | undefined;
let createAsset: Interfaces.ITransaction | undefined;
let burnAsset: Interfaces.ITransaction | undefined;
let transferAsset: Interfaces.ITransaction | undefined;

const collectionId = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
const owner = "owner";
const blockId = "blockId";

beforeAll(async () => {
	connection = await setupAppAndGetConnection();

	createAsset = new NFTBuilders.NFTCreateBuilder()
		.NFTCreateToken({
			collectionId,
			attributes: { name: "name" },
		})
		.nonce("1")
		.sign(passphrases[0]!)
		.build();

	burnAsset = new NFTBuilders.NFTBurnBuilder()
		.NFTBurnAsset({ nftId: createAsset.id! })
		.nonce("1")
		.sign(passphrases[0]!)
		.build();

	transferAsset = new NFTBuilders.NFTTransferBuilder()
		.NFTTransferAsset({
			nftIds: [createAsset.id!],
			recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
		})
		.nonce("1")
		.sign(passphrases[0]!)
		.build();
});

beforeEach(async () => {
	await resetDb(connection!);
	assetRepository = getCustomRepository(AssetRepository);
	auctionRepository = getCustomRepository(AuctionRepository);
});

afterAll(async () => {
	await tearDownAppAndcloseConnection(connection!);
});

describe("Test Asset repository", () => {
	it("createAsset", async () => {
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);

		const inserted = await assetRepository!.findOne(createAsset!.id);
		expect(inserted!.id).toBe(createAsset!.id);
		expect(inserted!.collectionId).toBe(assetData.asset!.nftToken.collectionId);
	});

	it("deleteAsset", async () => {
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);
		const inserted = await assetRepository!.findOne(createAsset!.id);
		await assetRepository!.deleteAsset(assetData);
		const deleted = await assetRepository!.findOne(createAsset!.id);

		expect(inserted!.id).toBe(createAsset!.id);
		expect(deleted).toBe(undefined);
	});

	it("burnAsset", async () => {
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);
		const preBurned = await assetRepository!.findOne(createAsset!.id);

		await assetRepository!.burnAsset(burnAsset!.data);
		const burned = await assetRepository!.findOne(createAsset!.id);

		expect(preBurned!.isBurned).toBe(false);
		expect(burned!.isBurned).toBe(true);
	});

	it("burnAssetRevert", async () => {
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);
		await assetRepository!.burnAsset(burnAsset!.data);
		const burned = await assetRepository!.findOne(createAsset!.id);
		await assetRepository!.burnAssetRevert(burnAsset!.data);
		const unburned = await assetRepository!.findOne(createAsset!.id);

		expect(burned!.isBurned).toBe(true);
		expect(unburned!.isBurned).toBe(false);
	});

	it("transferAsset", async () => {
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);
		const inserted = await assetRepository!.findOne(createAsset!.id);

		const newOwner = "newOwner";
		await assetRepository!.transferAsset({ ...transferAsset!.data, owner: newOwner });
		const transfered = await assetRepository!.findOne(createAsset!.id);

		expect(inserted!.owner).toBe(owner);
		expect(transfered!.owner).toBe(newOwner);
	});

	it("transferAssetRevert", async () => {
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);
		const newOwner = "newOwner";
		await assetRepository!.transferAsset({ ...transferAsset!.data, owner: newOwner });
		const transfered = await assetRepository!.findOne(createAsset!.id);
		await assetRepository!.transferAssetRevert({ ...transferAsset!.data, owner: newOwner });
		const untransfered = await assetRepository!.findOne(createAsset!.id);

		expect(transfered!.owner).toBe(newOwner);
		expect(untransfered!.owner).toBe(assetData.senderPublicKey);
	});

	it("addAuctionToAssets", async () => {
		const nftIds = [createAsset!.id!];
		const auction = await auctionRepository!.save({
			id: "auctionId",
			blockId,
			createdAt: new Date(),
			senderPublicKey: "sender",
			nftIds,
			expiration: 1,
			status: AuctionStatusEnum.IN_PROGRESS,
			startAmount: Utils.BigNumber.ONE,
		});
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);
		const withoutAuction = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });
		await assetRepository!.addAuctionToAssets(nftIds, auction.id);

		const withAuction = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });

		expect(withoutAuction!.auction).toBeNull();
		expect(withAuction!.auction.id).toBe(auction.id);
	});

	it("removeAuctionFromAssets", async () => {
		const nftIds = [createAsset!.id!];
		const auction = await auctionRepository!.save({
			id: "auctionId",
			blockId,
			createdAt: new Date(),
			senderPublicKey: "sender",
			nftIds,
			expiration: 1,
			status: AuctionStatusEnum.IN_PROGRESS,
			startAmount: Utils.BigNumber.ONE,
		});
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);
		await assetRepository!.addAuctionToAssets(nftIds, auction.id);
		const withAuction = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });
		await assetRepository!.removeAuctionFromAssets(auction.id);
		const withoutAuction = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });

		expect(withAuction!.auction.id).toBe(auction.id);
		expect(withoutAuction!.auction).toBeNull();
	});

	it("transferAndRemoveAuctionFromAssets", async () => {
		const nftIds = [createAsset!.id!];
		const auction = await auctionRepository!.save({
			id: "auctionId",
			blockId,
			createdAt: new Date(),
			senderPublicKey: "sender",
			nftIds,
			expiration: 1,
			status: AuctionStatusEnum.IN_PROGRESS,
			startAmount: Utils.BigNumber.ONE,
		});
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);
		await assetRepository!.addAuctionToAssets(nftIds, auction.id);
		const withAuction = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });
		const newOwner = "newOwner";
		await assetRepository!.transferAndRemoveAuctionFromAssets(auction.id, newOwner);
		const withoutAuction = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });

		expect(withAuction!.auction.id).toBe(auction.id);
		expect(withAuction!.owner).toBe(owner);
		expect(withoutAuction!.auction).toBeNull();
		expect(withoutAuction!.owner).toBe(newOwner);
	});

	it("transferAndAddAuctionToAssets", async () => {
		const nftIds = [createAsset!.id!];
		const auction = await auctionRepository!.save({
			id: "auctionId",
			blockId,
			createdAt: new Date(),
			senderPublicKey: "sender",
			nftIds,
			expiration: 1,
			status: AuctionStatusEnum.IN_PROGRESS,
			startAmount: Utils.BigNumber.ONE,
		});
		const assetData = { ...createAsset!.data, blockId, owner };
		await assetRepository!.createAsset(assetData);
		const inserted = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });
		const newOwner = "newOwner";
		await assetRepository!.transferAndAddAuctionToAssets(nftIds, auction.id, newOwner);
		const withAuction = await assetRepository!.findOne(createAsset!.id, { relations: ["auction"] });

		expect(inserted!.auction).toBeNull();
		expect(inserted!.owner).toBe(owner);
		expect(withAuction!.auction.id).toBe(auction.id);
		expect(withAuction!.owner).toBe(newOwner);
	});

	describe("Test getAssetsQuery", () => {
		it("get assets from owner", async () => {
			const assetData = { ...createAsset!.data, blockId, owner };
			await assetRepository!.createAsset(assetData);

			const createAsset2 = new NFTBuilders.NFTCreateBuilder()
				.NFTCreateToken({
					collectionId,
					attributes: { name: "name" },
				})
				.nonce("2")
				.sign(passphrases[0]!)
				.build();
			const assetData2 = { ...createAsset2.data, blockId, owner };
			await assetRepository!.createAsset(assetData2);

			const createAsset3 = new NFTBuilders.NFTCreateBuilder()
				.NFTCreateToken({
					collectionId,
					attributes: { name: "name" },
				})
				.nonce("3")
				.sign(passphrases[0]!)
				.build();
			const owner3 = "owner2";
			const assetData3 = { ...createAsset3.data, blockId, owner: owner3 };
			await assetRepository!.createAsset(assetData3);
			await assetRepository!.burnAsset(burnAsset!.data);

			const assets = await assetRepository!
				.getAssetsQuery(owner, false, false, {
					data: { height: 1 },
				} as Interfaces.IBlock)
				.getMany();

			expect(assets.length).toBe(1);
			expect(assets[0]!.id).toBe(createAsset2.id);
		});

		it("get assets that are in auction from owner", async () => {
			const assetData = { ...createAsset!.data, blockId, owner };
			await assetRepository!.createAsset(assetData);
			const nftIds = [createAsset!.id!];

			const createAsset2 = new NFTBuilders.NFTCreateBuilder()
				.NFTCreateToken({
					collectionId,
					attributes: { name: "name" },
				})
				.nonce("2")
				.sign(passphrases[0]!)
				.build();
			const assetData2 = { ...createAsset2.data, blockId, owner };
			await assetRepository!.createAsset(assetData2);
			const nftIds2 = [createAsset2.id!];

			const auction = await auctionRepository!.save({
				id: "auctionId",
				blockId,
				createdAt: new Date(),
				senderPublicKey: "sender",
				nftIds,
				expiration: 1,
				status: AuctionStatusEnum.IN_PROGRESS,
				startAmount: Utils.BigNumber.ONE,
			});
			await assetRepository!.addAuctionToAssets(nftIds, auction.id);

			const auction2 = await auctionRepository!.save({
				id: "auctionId1",
				blockId,
				createdAt: new Date(),
				senderPublicKey: "sender",
				nftIds: nftIds2,
				expiration: 10,
				status: AuctionStatusEnum.IN_PROGRESS,
				startAmount: Utils.BigNumber.ONE,
			});
			await assetRepository!.addAuctionToAssets(nftIds2, auction2.id);

			const assetsWithExpired = await assetRepository!
				.getAssetsQuery(owner, true, true, {
					data: { height: 5 },
				} as Interfaces.IBlock)
				.getMany();

			const assets = await assetRepository!
				.getAssetsQuery(owner, true, false, {
					data: { height: 5 },
				} as Interfaces.IBlock)
				.getMany();

			const assetsWhenAuctionsExpired = await assetRepository!
				.getAssetsQuery(owner, true, false, {
					data: { height: 15 },
				} as Interfaces.IBlock)
				.getMany();

			expect(assetsWithExpired.length).toBe(2);
			expect(assets.length).toBe(1);
			expect(assetsWhenAuctionsExpired.length).toBe(0);
		});
	});
});
