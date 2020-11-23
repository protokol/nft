import "@arkecosystem/core-test-framework/dist/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers, passphrases } from "@arkecosystem/core-test-framework";
import { Identities } from "@arkecosystem/crypto";
import { Builders as NFTBuilders } from "@protokol/nft-base-crypto";
import { Indexers, Interfaces } from "@protokol/nft-base-transactions";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
	app = await setUp();
	api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

let walletRepository: Contracts.State.WalletRepository;

describe("API - Assets", () => {
	let nftCreate;
	beforeEach(async () => {
		nftCreate = new NFTBuilders.NFTCreateBuilder()
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

		walletRepository = app.getTagged<Contracts.State.WalletRepository>(
			Container.Identifiers.WalletRepository,
			"state",
			"blockchain",
		);
		const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(passphrases[0]!));

		const tokensWallet = wallet.getAttribute<Interfaces.INFTTokens>("nft.base.tokenIds", []);
		// @ts-ignore
		tokensWallet[nftCreate.data.id] = {};
		wallet.setAttribute<Interfaces.INFTTokens>("nft.base.tokenIds", tokensWallet);

		walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);
	});
	describe("GET /assets", () => {
		it("should return all nft create transactions", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
				results: [{ ...nftCreate.data, serialized: nftCreate.serialized }],
				totalCount: 1,
				meta: { totalCountIsEstimate: false },
			});

			const response = await api.request("GET", "nft/assets", { transform: false });
			expect(response.data.data[0]!.id).toStrictEqual(nftCreate.id);
			expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftCreate.data.senderPublicKey);
			expect(response.data.data[0]!.asset.nftToken.collectionId).toStrictEqual(
				"8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			);
			expect(response.data.data[0]!.asset.nftToken.attributes).toBeObject();
		});
	});

	describe("GET /assets/{id}", () => {
		it("should return specific nft create transaction by its id", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
				{
					...nftCreate.data,
					serialized: nftCreate.serialized,
				},
			]);

			const response = await api.request("GET", `nft/assets/${nftCreate.id}`);

			expect(response.data.data.id).toStrictEqual(nftCreate.id);
			expect(response.data.data.ownerPublicKey).toStrictEqual(nftCreate.data.senderPublicKey);
			expect(response.data.data.senderPublicKey).toStrictEqual(nftCreate.data.senderPublicKey);
			expect(response.data.data.collectionId).toStrictEqual(
				"8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			);
			expect(response.data.data.attributes).toBeObject();
		});
	});

	describe("GET /assets/{id}/wallets", () => {
		it("should return wallet by token id", async () => {
			walletRepository = app.getTagged<Contracts.State.WalletRepository>(
				Container.Identifiers.WalletRepository,
				"state",
				"blockchain",
			);
			const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(passphrases[0]!));

			const tokensWallet = wallet.getAttribute<Interfaces.INFTTokens>("nft.base.tokenIds", []);
			tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
			wallet.setAttribute<Interfaces.INFTTokens>("nft.base.tokenIds", tokensWallet);

			walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);

			const response = await api.request(
				"GET",
				`nft/assets/8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61/wallets`,
			);
			expect(response).toBeSuccessfulResponse();
		});
	});

	describe("POST /assets/search", () => {
		it("should search assets", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
				results: [{ ...nftCreate.data, serialized: nftCreate.serialized }],
				totalCount: 1,
				meta: { totalCountIsEstimate: false },
			});

			const response = await api.request("POST", "nft/assets/search?transform=false", {
				damage: 3,
			});
			console.log(response.data.data);
			expect(response.data.data[0]!.id).toStrictEqual(nftCreate.id);
			expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftCreate.data.senderPublicKey);
			expect(response.data.data[0]!.asset.nftToken.collectionId).toStrictEqual(
				"8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			);
			expect(response.data.data[0]!.asset.nftToken.attributes).toBeObject();
		});
	});
});
