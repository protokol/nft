import "jest-extended";

import { Application, Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { Indexers, Interfaces as NFTInterfaces } from "@protokol/nft-base-transactions";

import { CollectionsController } from "../../../src/controllers/collections";
import {
	blockHistoryService,
	buildSenderWallet,
	initApp,
	ItemResponse,
	PaginatedResponse,
	transactionHistoryService,
} from "../__support__";

let app: Application;

let collectionController: CollectionsController;

let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

let actual: Interfaces.ITransaction;

const timestamp = Utils.formatTimestamp(104930456);

const nftCollectionAsset = {
	name: "Nft card",
	description: "Nft card description",
	maximumSupply: 100,
	jsonSchema: {
		type: "object",
		additionalProperties: false,
		properties: {
			name: {
				type: "string",
				minLength: 3,
			},
			damage: {
				type: "integer",
			},
			health: {
				type: "integer",
			},
			mana: {
				type: "integer",
			},
		},
	},
};

beforeEach(() => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);

	app = initApp();

	walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

	senderWallet = buildSenderWallet(app);

	transactionHistoryService.findManyByCriteria.mockReset();
	transactionHistoryService.findOneByCriteria.mockReset();
	transactionHistoryService.listByCriteria.mockReset();
	transactionHistoryService.listByCriteriaJoinBlock.mockReset();

	blockHistoryService.findOneByCriteria.mockReset();

	collectionController = app.resolve<CollectionsController>(CollectionsController);

	actual = new Builders.NFTRegisterCollectionBuilder()
		.NFTRegisterCollectionAsset({
			name: "Heartstone card",
			description: "A card from heartstone game",
			maximumSupply: 100,
			jsonSchema: {
				properties: {
					number: {
						type: "number",
					},
					string: { type: "string" },
				},
			},
		})
		.sign(passphrases[0]!)
		.build();
});

afterEach(() => {
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTRegisterCollectionTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTCreateTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTTransferTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBurnTransaction);
});

describe("Test collection controller", () => {
	it("index - return all collections", async () => {
		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
			results: [{ data: actual.data, block: { timestamp: timestamp.epoch } }],
		});

		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
		};
		const response = (await collectionController.index(request, undefined)) as PaginatedResponse;

		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			name: "Heartstone card",
			description: "A card from heartstone game",
			maximumSupply: 100,
			jsonSchema: {
				properties: {
					number: {
						type: "number",
					},
					string: { type: "string" },
				},
			},
			timestamp,
		});
	});

	it("showByWalletId - return wallet by collectionId", async () => {
		const collectionsWallet = senderWallet.getAttribute<NFTInterfaces.INFTCollections>("nft.base.collections", {});
		collectionsWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
			currentSupply: 0,
			nftCollectionAsset: nftCollectionAsset,
		};
		senderWallet.setAttribute("nft.base.collections", collectionsWallet);
		walletRepository.getIndex(Indexers.NFTIndexers.CollectionIndexer).index(senderWallet);

		const request: Hapi.Request = {
			params: {
				id: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			},
		};

		const response = (await collectionController.showByWalletId(request, undefined)) as ItemResponse;

		expect(response.data).toStrictEqual({
			address: senderWallet.address,
			publicKey: senderWallet.publicKey,
			nft: {
				collections: [
					{
						collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
						currentSupply: 0,
						nftCollectionAsset: nftCollectionAsset,
					},
				],
				assetsIds: [],
			},
		});
	});

	it("show - return specific collection transaction", async () => {
		transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);
		blockHistoryService.findOneByCriteria.mockResolvedValueOnce({ timestamp: timestamp.epoch });

		const request: Hapi.Request = {
			query: {
				transform: true,
			},
			params: {
				id: actual.id,
			},
		};

		const response = (await collectionController.show(request, undefined)) as ItemResponse;
		expect(response.data).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			name: "Heartstone card",
			description: "A card from heartstone game",
			maximumSupply: 100,
			jsonSchema: {
				properties: {
					number: {
						type: "number",
					},
					string: { type: "string" },
				},
			},
			timestamp,
		});
	});

	it("showSchema - return schema by specific id", async () => {
		transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);
		blockHistoryService.findOneByCriteria.mockResolvedValueOnce({ timestamp: timestamp.epoch });

		const request: Hapi.Request = {
			query: {
				transform: true,
			},
			params: {
				id: actual.id,
			},
		};

		const response = (await collectionController.showSchema(request, undefined)) as ItemResponse;
		expect(response.data).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			properties: {
				number: {
					type: "number",
				},
				string: { type: "string" },
			},
			timestamp,
		});
	});

	it("searchCollection - search collection by payload", async () => {
		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
			results: [{ data: actual.data, block: { timestamp: timestamp.epoch } }],
		});
		const request: Hapi.Request = {
			payload: {
				type: "number",
			},
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
		};

		const response = (await collectionController.searchCollection(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			name: "Heartstone card",
			description: "A card from heartstone game",
			maximumSupply: 100,
			jsonSchema: {
				properties: {
					number: {
						type: "number",
					},
					string: { type: "string" },
				},
			},
			timestamp,
		});
	});

	it("showAssetsByCollectionId - returns nftTokens by collection id", async () => {
		const actual = new Builders.NFTCreateBuilder()
			.NFTCreateToken({
				collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
				attributes: {
					number: 5,
					string: "something",
				},
			})
			.sign(passphrases[0]!)
			.build();

		const tokensWallet = senderWallet.getAttribute<NFTInterfaces.INFTTokens>("nft.base.tokenIds", {});
		// @ts-ignore
		tokensWallet[actual.id] = {};
		senderWallet.setAttribute<NFTInterfaces.INFTTokens>("nft.base.tokenIds", tokensWallet);
		walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(senderWallet);

		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
			results: [{ data: actual.data, block: { timestamp: timestamp.epoch } }],
		});

		const request: Hapi.Request = {
			params: {
				id: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
			},
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
		};
		const response = (await collectionController.showAssetsByCollectionId(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			ownerPublicKey: actual.data.senderPublicKey,
			senderPublicKey: actual.data.senderPublicKey,
			collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
			attributes: {
				number: 5,
				string: "something",
			},
			timestamp,
		});
	});
});
