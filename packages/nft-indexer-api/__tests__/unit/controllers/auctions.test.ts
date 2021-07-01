import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import Hapi from "@hapi/hapi";
import * as typeorm from "typeorm";

import { AuctionController } from "../../../src/controllers/auctions";
import { BaseController } from "../../../src/controllers/base";
import { buildSenderWallet, initApp, PaginatedResponse } from "../__support__";

let app: Application;
let auctionsController: AuctionController;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

const buildGetAuctionsQuery = (results) => ({
	getManyAndCount: () => [results, results.length],
	skip: () => undefined,
	take: () => undefined,
});

const mockRepo = {
	getAuctionsQuery: () => buildGetAuctionsQuery([]),
	getSearchAuctionsQuery: () => buildGetAuctionsQuery([]),
};

jest.spyOn(typeorm, "getCustomRepository").mockImplementation(() => mockRepo);

const auctions = [
	{
		id: "76e12bfc9533387be6f933472b3fe63b98921e9ce424ce972f78cca77cf4c0b1",
		blockId: "10990724884191176068",
		createdAt: "2021-06-28T11:32:26.740Z",
		senderPublicKey: "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
		nftIds: ["0194762c449f44db462600e6901bbadd95c30902f4c8a9be2ab4aa394a76c8f5"],
		startAmount: "1",
		expiration: 1000000,
		status: "IN_PROGRESS",
	},
	{
		id: "22d1498680a63c910f9078a01ecb082688f8b3d0430843d1057d5dcd9638e152",
		blockId: "4567216750129223483",
		createdAt: "2021-06-28T11:32:26.749Z",
		senderPublicKey: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
		nftIds: ["535775323ea999bf3b1a42689681999543164fb44ba7728bedc33f88d9660f3e"],
		startAmount: "1",
		expiration: 1000000,
		status: "IN_PROGRESS",
	},
];

beforeEach(() => {
	app = initApp();
	auctionsController = app.resolve<AuctionController>(AuctionController);

	walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

	senderWallet = buildSenderWallet(app);
	walletRepository.index(senderWallet);
});

describe("Test auctions controller", () => {
	it("index - return all auctions", async () => {
		mockRepo.getAuctionsQuery = () => buildGetAuctionsQuery(auctions);

		const request: Hapi.Request = {
			query: {
				transform: false,
			},
		};

		const response = (await auctionsController.index(request)) as PaginatedResponse;

		expect(response.totalCount).toBe(auctions.length);
		expect(response.meta).toStrictEqual({ totalCountIsEstimate: false });
		expect(response.results.length).toBe(auctions.length);
		expect(response.results[0]).toEqual(auctions[0]);
	});

	it("search - search for auctions", async () => {
		mockRepo.getSearchAuctionsQuery = () => buildGetAuctionsQuery(auctions);

		const request: Hapi.Request = {
			query: {
				transform: false,
			},
		};

		const response = (await auctionsController.search(request)) as PaginatedResponse;

		expect(response.totalCount).toBe(auctions.length);
		expect(response.meta).toStrictEqual({ totalCountIsEstimate: false });
		expect(response.results.length).toBe(auctions.length);
		expect(response.results[0]).toEqual(auctions[0]);
	});

	it("search - search for auctions with bids", async () => {
		const paginateSpy = jest.spyOn(BaseController.prototype, "paginateWithBlock");
		mockRepo.getSearchAuctionsQuery = () => buildGetAuctionsQuery(auctions);

		const request: Hapi.Request = {
			query: {
				transform: false,
				includeBids: true,
			},
		};

		const response = (await auctionsController.search(request)) as PaginatedResponse;

		expect(response.totalCount).toBe(auctions.length);
		expect(response.meta).toStrictEqual({ totalCountIsEstimate: false });
		expect(response.results.length).toBe(auctions.length);
		expect(response.results[0]).toEqual(auctions[0]);
		expect(paginateSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), "bids");
	});
});
