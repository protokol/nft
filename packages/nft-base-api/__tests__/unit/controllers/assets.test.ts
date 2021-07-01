import "jest-extended";

import { Application, Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Identities, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import {
	Builders,
	Interfaces as NFTCryptoInterfaces,
	Transactions as NFTTransactions,
} from "@protokol/nft-base-crypto";
import { Indexers, Interfaces as NFTInterfaces } from "@protokol/nft-base-transactions";

import { AssetsController } from "../../../src/controllers/assets";
import {
	blockHistoryService,
	buildSenderWallet,
	ErrorResponse,
	initApp,
	ItemResponse,
	PaginatedResponse,
	transactionHistoryService,
} from "../__support__";

let app: Application;

let assetController: AssetsController;

let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

let actual: Interfaces.ITransaction;

const timestamp = Utils.formatTimestamp(104930456);
const collectionId = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
const recipientId = "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo";

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

	assetController = app.resolve<AssetsController>(AssetsController);

	actual = new Builders.NFTCreateBuilder()
		.NFTCreateToken({
			collectionId,
			attributes: {
				name: "card name",
				damage: 3,
				health: 2,
				mana: 2,
			},
		})
		.sign(passphrases[0]!)
		.build();

	const tokensWallet = senderWallet.getAttribute<NFTInterfaces.INFTTokens>("nft.base.tokenIds", {});
	// @ts-ignore
	tokensWallet[actual.id] = {};
	senderWallet.setAttribute<NFTInterfaces.INFTTokens>("nft.base.tokenIds", tokensWallet);
	walletRepository.index(senderWallet);
	walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(senderWallet);

	app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<string>(
		"mintPassphrase",
		passphrases[0]!,
	);
});

afterEach(() => {
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTRegisterCollectionTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTCreateTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTTransferTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBurnTransaction);
});

describe("Test asset controller", () => {
	it("index - return all nftCreate transactions", async () => {
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

		const response = (await assetController.index(request)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			ownerPublicKey: senderWallet.getPublicKey(),
			senderPublicKey: senderWallet.getPublicKey(),
			collectionId,
			attributes: {
				name: "card name",
				damage: 3,
				health: 2,
				mana: 2,
			},
			timestamp,
		});
	});

	it("showAssetWallet - return wallet by nfts id", async () => {
		const tokensWallet = senderWallet.getAttribute<NFTInterfaces.INFTTokens>("nft.base.tokenIds", {});
		// @ts-ignore
		tokensWallet[actual.id] = {};
		senderWallet.setAttribute<NFTInterfaces.INFTTokens>("nft.base.tokenIds", tokensWallet);
		walletRepository.index(senderWallet);

		const request: Hapi.Request = {
			params: {
				id: actual.id,
			},
		};
		const response = (await assetController.showAssetWallet(request)) as ItemResponse;

		expect(response.data).toStrictEqual({
			address: recipientId,
			publicKey: senderWallet.getPublicKey(),
			nft: {
				assetsIds: [actual.id],
				collections: [],
			},
		});
	});

	it("showAssetWallet - should return error if no wallet by nfts id", async () => {
		walletRepository.forgetOnIndex(Indexers.NFTIndexers.NFTTokenIndexer, actual.id!);
		const request: Hapi.Request = {
			params: {
				id: actual.id,
			},
		};
		const response = (await assetController.showAssetWallet(request)) as ErrorResponse;

		expect(response.isBoom).toBeTrue();
		expect(response.output.statusCode).toBe(404);
	});

	it("showWalletAssets - should return error if no wallet", async () => {
		const request: Hapi.Request = {
			params: {
				id: actual.id,
			},
		};
		const response = (await assetController.showWalletAssets(request)) as ErrorResponse;

		expect(response.isBoom).toBeTrue();
		expect(response.output.statusCode).toBe(404);
	});

	it("showWalletAssets - should return all assets that wallet contains", async () => {
		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
			results: [{ data: actual.data, block: { timestamp: timestamp.epoch } }],
		});

		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
			params: {
				id: senderWallet.getPublicKey(),
			},
		};
		const response = (await assetController.showWalletAssets(request)) as PaginatedResponse;

		expect(response.results).toStrictEqual([
			{
				id: actual.id,
				ownerPublicKey: senderWallet.getPublicKey(),
				senderPublicKey: senderWallet.getPublicKey(),
				collectionId,
				attributes: {
					name: "card name",
					damage: 3,
					health: 2,
					mana: 2,
				},
				timestamp,
			},
		]);
	});

	it("show - return nftCreate transaction by its id", async () => {
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

		const response = (await assetController.show(request)) as ItemResponse;

		expect(response.data).toStrictEqual({
			id: actual.id,
			ownerPublicKey: senderWallet.getPublicKey(),
			senderPublicKey: senderWallet.getPublicKey(),
			collectionId,
			attributes: {
				name: "card name",
				damage: 3,
				health: 2,
				mana: 2,
			},
			timestamp,
		});
	});

	it("show - return error if no asset by id", async () => {
		transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(undefined);

		const request: Hapi.Request = {
			query: {
				transform: true,
			},
			params: {
				id: actual.id,
			},
		};

		const response = (await assetController.show(request)) as ErrorResponse;

		expect(response.isBoom).toBeTrue();
		expect(response.output.statusCode).toBe(404);
	});

	it("showByAsset - return transaction by payloads criteria", async () => {
		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
			results: [{ data: actual.data, block: { timestamp: timestamp.epoch } }],
		});
		const request: Hapi.Request = {
			payload: {
				name: "card name",
			},
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
		};

		const response = (await assetController.showByAsset(request)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			ownerPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]!),
			senderPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]!),
			collectionId,
			attributes: {
				name: "card name",
				damage: 3,
				health: 2,
				mana: 2,
			},
			timestamp,
		});
	});

	it("claim asset - throw error if no passphrase", async () => {
		app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).unset<string>(
			"mintPassphrase",
		);
		const response = (await assetController.claimAsset(undefined)) as ErrorResponse;

		expect(response.isBoom).toBeTrue();
		expect(response.output.statusCode).toBe(501);
	});

	it("claim asset - throw error if not a valid recipient address", async () => {
		const request = {
			payload: { recipientId: "address" },
		};
		const response = (await assetController.claimAsset(request)) as ErrorResponse;

		expect(response.isBoom).toBeTrue();
		expect(response.output.statusCode).toBe(422);
	});

	it("claim asset - throw error if not a valid collectionId", async () => {
		const request = {
			payload: { recipientId, collectionId: "collection" },
		};
		const response = (await assetController.claimAsset(request)) as ErrorResponse;

		expect(response.isBoom).toBeTrue();
		expect(response.output.statusCode).toBe(422);
	});

	it("claim asset - throw error if collection does not support claiming", async () => {
		const collectionsWallet = senderWallet.getAttribute<NFTInterfaces.INFTCollections>("nft.base.collections", {});
		collectionsWallet[collectionId] = {
			currentSupply: 0,
			nftCollectionAsset: {} as NFTCryptoInterfaces.NFTCollectionAsset,
		};
		senderWallet.setAttribute("nft.base.collections", collectionsWallet);
		walletRepository.getIndex(Indexers.NFTIndexers.CollectionIndexer).index(senderWallet);

		const request = {
			payload: {
				recipientId,
				collectionId,
			},
		};
		const response = (await assetController.claimAsset(request)) as ErrorResponse;

		expect(response.isBoom).toBeTrue();
		expect(response.output.statusCode).toBe(422);
	});

	it("claim asset successfully", async () => {
		const metadata = { name: "name" };
		const collectionsWallet = senderWallet.getAttribute<NFTInterfaces.INFTCollections>("nft.base.collections", {});
		collectionsWallet[collectionId] = {
			currentSupply: 0,
			nftCollectionAsset: { metadata } as NFTCryptoInterfaces.NFTCollectionAsset,
		};
		senderWallet.setAttribute("nft.base.collections", collectionsWallet);
		walletRepository.getIndex(Indexers.NFTIndexers.CollectionIndexer).index(senderWallet);

		const request = { payload: { recipientId, collectionId } };
		const response = (await assetController.claimAsset(request)) as ItemResponse;

		expect(response).toStrictEqual(
			new Builders.NFTCreateBuilder()
				.NFTCreateToken({
					collectionId,
					attributes: metadata,
					recipientId,
				})
				.nonce("1")
				.sign(passphrases[0]!)
				.build()
				.toJson(),
		);
	});
});
