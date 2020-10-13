import "jest-extended";

import { Auctions } from "../../../../src/resources/nft/exchange/auctions";
import { configureExchangeMocks } from "../../../mocks/nft/exchange";

const resource: Auctions = configureExchangeMocks<Auctions>(Auctions);

describe("API - 1.0 - Exchange/Resources - Auctions", () => {
	it('should call \\"getAllAuctions\\" method', async () => {
		const response = await resource.getAllAuctions();

		expect(response.status).toBe(200);

		// Pagination
		// expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
		expect(response.body.meta.count).toBe(1);
		expect(response.body.meta.pageCount).toBe(1);
		expect(response.body.meta.totalCount).toBe(1);
		expect(response.body.meta.next).toBeNull();
		expect(response.body.meta.previous).toBeNull();
		expect(response.body.meta.self).toBe("/nft/exchange/auctions?transform=true&page=1&limit=100");
		expect(response.body.meta.first).toBe("/nft/exchange/auctions?transform=true&page=1&limit=100");
		expect(response.body.meta.last).toBe("/nft/exchange/auctions?transform=true&page=1&limit=100");

		// Data
		expect(response.body.data[0].id).toBe("d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a");
		expect(response.body.data[0].senderPublicKey).toBe(
			"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
		);
		expect(response.body.data[0].nftAuction.nftIds).toStrictEqual([
			"a8016c66d160606e289ed8bab6ce2b2d9916197111e8612257b10e54d83ba827",
		]);
		expect(response.body.data[0].nftAuction.startAmount).toStrictEqual("999");
		expect(response.body.data[0].nftAuction.expiration.blockHeight).toStrictEqual(1000000);
		expect(response.body.data[0].timestamp.epoch).toStrictEqual(102726648);
		expect(response.body.data[0].timestamp.unix).toStrictEqual(1592827848);
		expect(response.body.data[0].timestamp.human).toStrictEqual("2020-06-22T12:10:48.000Z");
	});

	it('should call \\"getAuctionById\\" method', async () => {
		const response = await resource.getAuctionById(
			"d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
		);

		expect(response.status).toBe(200);

		// Data
		expect(response.body.data.id).toBe("d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a");
		expect(response.body.data.senderPublicKey).toBe(
			"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
		);
		expect(response.body.data.nftAuction.nftIds).toStrictEqual([
			"a8016c66d160606e289ed8bab6ce2b2d9916197111e8612257b10e54d83ba827",
		]);
		expect(response.body.data.nftAuction.startAmount).toStrictEqual("999");
		expect(response.body.data.nftAuction.expiration.blockHeight).toStrictEqual(1000000);
		expect(response.body.data.timestamp.epoch).toStrictEqual(102726648);
		expect(response.body.data.timestamp.unix).toStrictEqual(1592827848);
		expect(response.body.data.timestamp.human).toStrictEqual("2020-06-22T12:10:48.000Z");
	});

	it('should call \\"getAuctionsWallets\\" method', async () => {
		const response = await resource.getAuctionsWallets(
			"717ce9f6dff858c4972b067a1fce8ea72fb1c4ac60c4a75cc8e9993dbbe7541a",
		);

		expect(response.status).toBe(200);

		// Data
		expect(response.body.data.address).toStrictEqual("AV6GP5qhhsZG6MHb4gShy22doUnVjEKHcN");
		expect(response.body.data.publicKey).toStrictEqual(
			"022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
		);
		expect(response.body.data.nft.collections).toBeArray();
		expect(response.body.data.nft.collections[0]).toBeObject();
		expect(response.body.data.nft.lockedBalance).toStrictEqual("0");
		expect(response.body.data.nft.auctions).toStrictEqual([
			{
				auctionId: "717ce9f6dff858c4972b067a1fce8ea72fb1c4ac60c4a75cc8e9993dbbe7541a",
				nftIds: ["283ef247a5bdd934f23680b3c85825ac20ab5a6f71ca0757633ae65b02df0bc8"],
				bids: ["a1588c8e291574e918ebb28b3390dc65186801ff852ebd5292600c34692f9d13"],
			},
		]);
	});

	it('should call \\"searchByAsset\\" method', async () => {
		const response = await resource.searchByAsset({
			nftIds: ["a8016c66d160606e289ed8bab6ce2b2d9916197111e8612257b10e54d83ba827"],
		});

		expect(response.status).toBe(200);

		// Pagination
		// expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
		expect(response.body.meta.count).toBe(1);
		expect(response.body.meta.pageCount).toBe(1);
		expect(response.body.meta.totalCount).toBe(1);
		expect(response.body.meta.next).toBeNull();
		expect(response.body.meta.previous).toBeNull();
		expect(response.body.meta.self).toBe("/nft/exchange/auctions/search?page=1&limit=100&transform=true");
		expect(response.body.meta.first).toBe("/nft/exchange/auctions/search?page=1&limit=100&transform=true");
		expect(response.body.meta.last).toBe("/nft/exchange/auctions/search?page=1&limit=100&transform=true");

		// Data
		expect(response.body.data[0].id).toBe("d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a");
		expect(response.body.data[0].senderPublicKey).toBe(
			"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
		);
		expect(response.body.data[0].nftAuction.nftIds).toStrictEqual([
			"a8016c66d160606e289ed8bab6ce2b2d9916197111e8612257b10e54d83ba827",
		]);
		expect(response.body.data[0].nftAuction.startAmount).toStrictEqual("999");
		expect(response.body.data[0].nftAuction.expiration.blockHeight).toStrictEqual(1000000);
		expect(response.body.data[0].timestamp.epoch).toStrictEqual(102726648);
		expect(response.body.data[0].timestamp.unix).toStrictEqual(1592827848);
		expect(response.body.data[0].timestamp.human).toStrictEqual("2020-06-22T12:10:48.000Z");
	});

	it('should call \\"getAllCanceledAuctions\\" method', async () => {
		const response = await resource.getAllCanceledAuctions();

		expect(response.status).toBe(200);

		// Pagination
		// expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
		expect(response.body.meta.count).toBe(1);
		expect(response.body.meta.pageCount).toBe(1);
		expect(response.body.meta.totalCount).toBe(1);
		expect(response.body.meta.next).toBeNull();
		expect(response.body.meta.previous).toBeNull();
		expect(response.body.meta.self).toBe("/nft/exchange/auctions/canceled?page=1&limit=100&transform=true");
		expect(response.body.meta.first).toBe("/nft/exchange/auctions/canceled?page=1&limit=100&transform=true");
		expect(response.body.meta.last).toBe("/nft/exchange/auctions/canceled?page=1&limit=100&transform=true");

		// Data
		expect(response.body.data[0].id).toBe("808a080c53dcc77ec01ce0fe76598b4b3d1bacfabee082dada636784b115a150");
		expect(response.body.data[0].senderPublicKey).toBe(
			"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
		);
		expect(response.body.data[0].nftAuctionCancel.auctionId).toStrictEqual(
			"58dc9625ff7190dc3ff2dbf541a2bb2c8a85366f2cbe95d21ec9b8970f41d086",
		);
		expect(response.body.data[0].timestamp.epoch).toStrictEqual(102726256);
		expect(response.body.data[0].timestamp.unix).toStrictEqual(1592827456);
		expect(response.body.data[0].timestamp.human).toStrictEqual("2020-06-22T12:04:16.000Z");
	});

	it('should call \\"getCanceledAuctionById\\" method', async () => {
		const response = await resource.getCanceledAuctionById(
			"808a080c53dcc77ec01ce0fe76598b4b3d1bacfabee082dada636784b115a150",
		);

		expect(response.status).toBe(200);

		// Data
		expect(response.body.data.id).toBe("808a080c53dcc77ec01ce0fe76598b4b3d1bacfabee082dada636784b115a150");
		expect(response.body.data.senderPublicKey).toBe(
			"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
		);
		expect(response.body.data.nftAuctionCancel.auctionId).toStrictEqual(
			"58dc9625ff7190dc3ff2dbf541a2bb2c8a85366f2cbe95d21ec9b8970f41d086",
		);
		expect(response.body.data.timestamp.epoch).toStrictEqual(102726256);
		expect(response.body.data.timestamp.unix).toStrictEqual(1592827456);
		expect(response.body.data.timestamp.human).toStrictEqual("2020-06-22T12:04:16.000Z");
	});
});
