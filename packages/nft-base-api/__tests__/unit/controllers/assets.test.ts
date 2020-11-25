import "jest-extended";

import { Application, Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Identities, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { Indexers, Interfaces as NFTInterfaces } from "@protokol/nft-base-transactions";

import { AssetsController } from "../../../src/controllers/assets";
import {
	blockHistoryService,
	buildSenderWallet,
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
			collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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

		const response = (await assetController.index(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			ownerPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]!),
			senderPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]!),
			collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
		const response = (await assetController.showAssetWallet(request, undefined)) as ItemResponse;

		expect(response.data).toStrictEqual({
			address: "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
			publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
			nft: {
				assetsIds: [actual.id],
				collections: [],
			},
		});
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

		const response = (await assetController.show(request, undefined)) as ItemResponse;

		expect(response.data).toStrictEqual({
			id: actual.id,
			ownerPublicKey: senderWallet.publicKey,
			senderPublicKey: senderWallet.publicKey,
			collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			attributes: {
				name: "card name",
				damage: 3,
				health: 2,
				mana: 2,
			},
			timestamp,
		});
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

		const response = (await assetController.showByAsset(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			ownerPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]!),
			senderPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]!),
			collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			attributes: {
				name: "card name",
				damage: 3,
				health: 2,
				mana: 2,
			},
			timestamp,
		});
	});
});
