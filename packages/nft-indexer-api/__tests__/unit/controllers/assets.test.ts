import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import Hapi from "@hapi/hapi";
import * as typeorm from "typeorm";

import { AssetController } from "../../../src/controllers/assets";
import { buildSenderWallet, ErrorResponse, initApp, PaginatedResponse } from "../__support__";

let app: Application;
let assetsController: AssetController;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

const buildGetAssetsQuery = (results) => ({
	getManyAndCount: () => [results, results.length],
	skip: () => undefined,
	take: () => undefined,
});

const mockRepo = {
	getAssetsQuery: () => buildGetAssetsQuery([]),
};

jest.spyOn(typeorm, "getCustomRepository").mockImplementation(() => mockRepo);

const asset = {
	id: "535775323ea999bf3b1a42689681999543164fb44ba7728bedc33f88d9660f3e",
	blockId: "17757540953593672",
	createdAt: "2021-06-28T11:32:26.579Z",
	owner: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
	collectionId: "3c4a754dcfe72a14129769f377dc45e386b6dec3a71e8ff1892d2583877eaa05",
	attributes: {
		name: "Tests auction 1",
		pac: 90,
	},
	isBurned: false,
};

beforeEach(() => {
	app = initApp();
	assetsController = app.resolve<AssetController>(AssetController);

	walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

	senderWallet = buildSenderWallet(app);
	walletRepository.index(senderWallet);
});

describe("Test assets controller", () => {
	it("showWalletAssets - return wallet's assets", async () => {
		mockRepo.getAssetsQuery = () => buildGetAssetsQuery([asset]);

		const request: Hapi.Request = {
			query: {
				transform: false,
			},
			params: {
				id: senderWallet.getPublicKey(),
			},
		};

		const response = (await assetsController.showWalletAssets(request)) as PaginatedResponse;

		expect(response.totalCount).toBe(1);
		expect(response.meta).toStrictEqual({ totalCountIsEstimate: false });
		expect(response.results.length).toBe(1);
		expect(response.results[0]).toEqual(asset);
	});

	it("showWalletAssets - return 404 if no wallet exist", async () => {
		const request: Hapi.Request = {
			query: {
				transform: true,
			},
			params: {
				id: "id",
			},
		};

		const response = (await assetsController.showWalletAssets(request)) as ErrorResponse;

		expect(response.output.statusCode).toEqual(404);
	});
});
