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

describe("API - Collections", () => {
	let nftRegisteredCollection;
	beforeEach(async () => {
		nftRegisteredCollection = new NFTBuilders.NFTRegisterCollectionBuilder()
			.NFTRegisterCollectionAsset({
				name: "Nft card",
				description: "Nft card description",
				maximumSupply: 100,
				jsonSchema: {
					properties: {
						name: {
							type: "string",
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
			})
			.sign(passphrases[0]!)
			.build();
	});
	describe("GET /nft/collections", () => {
		it("should GET get all nft collections transactions", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
				results: [{ ...nftRegisteredCollection.data, serialized: nftRegisteredCollection.serialized }],
				totalCount: 1,
				meta: { totalCountIsEstimate: false },
			});

			const response = await api.request("GET", "nft/collections", { transform: false });

			expect(response).toBeSuccessfulResponse();
			api.expectPaginator(response);
			expect(response.data.data).toBeArray();
			expect(response.data.data[0]!.id).toStrictEqual(nftRegisteredCollection.id);
			expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftRegisteredCollection.data.senderPublicKey);
			expect(response.data.data[0]!.asset.nftCollection.name).toStrictEqual("Nft card");
			expect(response.data.data[0]!.asset.nftCollection.description).toStrictEqual("Nft card description");
			expect(response.data.data[0]!.asset.nftCollection.maximumSupply).toStrictEqual(100);
			expect(response.data.data[0]!.asset.nftCollection.jsonSchema).toBeObject();
		});
	});

	describe("GET /collections/{id}", () => {
		it("should return specific id", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
				{
					...nftRegisteredCollection.data,
					serialized: nftRegisteredCollection.serialized,
				},
			]);

			const response = await api.request("GET", `nft/collections/${nftRegisteredCollection.id}`);

			expect(response).toBeSuccessfulResponse();
			expect(response.data.data.id).toBe(nftRegisteredCollection.id);
			expect(response.data.data.senderPublicKey).toStrictEqual(nftRegisteredCollection.data.senderPublicKey);
			expect(response.data.data.name).toStrictEqual("Nft card");
			expect(response.data.data.description).toStrictEqual("Nft card description");
			expect(response.data.data.maximumSupply).toStrictEqual(100);
			expect(response.data.data.jsonSchema).toBeObject();
		});
	});

	describe("GET /collections/{id}/schema", () => {
		it("should return schema by id", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
				{
					...nftRegisteredCollection.data,
					serialized: nftRegisteredCollection.serialized,
				},
			]);

			const response = await api.request("GET", `nft/collections/${nftRegisteredCollection.id}/schema`);

			expect(response).toBeSuccessfulResponse();
			expect(response.data.data.id).toBe(nftRegisteredCollection.id);
			expect(response.data.data.senderPublicKey).toBe(nftRegisteredCollection.data.senderPublicKey);
			expect(response.data.data.properties).toBeObject();
		});
	});

	describe("GET /collections/{id}/wallets", () => {
		let walletRepository: Contracts.State.WalletRepository;
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
		it("should return wallet by collection id", async () => {
			walletRepository = app.getTagged<Contracts.State.WalletRepository>(
				Container.Identifiers.WalletRepository,
				"state",
				"blockchain",
			);

			const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(passphrases[0]!));

			const collectionsWallet = wallet.getAttribute<Interfaces.INFTCollections>("nft.base.collections", {});
			collectionsWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
				currentSupply: 0,
				nftCollectionAsset: nftCollectionAsset,
			};
			wallet.setAttribute("nft.base.collections", collectionsWallet);

			walletRepository.getIndex(Indexers.NFTIndexers.CollectionIndexer).index(wallet);

			const response = await api.request(
				"GET",
				`nft/collections/8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61/wallets`,
			);
			expect(response).toBeSuccessfulResponse();
		});
	});

	describe("POST /collections/search", () => {
		it("should search collection", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
				results: [{ ...nftRegisteredCollection.data, serialized: nftRegisteredCollection.serialized }],
				totalCount: 1,
				meta: { totalCountIsEstimate: false },
			});

			const response = await api.request("POST", "nft/collections/search?transform=false", {
				type: "number",
			});
			expect(response).toBeSuccessfulResponse();
			api.expectPaginator(response);
			expect(response.data.data).toBeArray();
			expect(response.data.data[0]!.id).toStrictEqual(nftRegisteredCollection.id);
			expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftRegisteredCollection.data.senderPublicKey);
			expect(response.data.data[0]!.asset.nftCollection.name).toStrictEqual("Nft card");
			expect(response.data.data[0]!.asset.nftCollection.description).toStrictEqual("Nft card description");
			expect(response.data.data[0]!.asset.nftCollection.maximumSupply).toStrictEqual(100);
			expect(response.data.data[0]!.asset.nftCollection.jsonSchema).toBeObject();
		});
	});

	describe("GET /collections/{id}/assets", () => {
		let nftToken;
		it("should find assets by collection id", async () => {
			nftToken = new NFTBuilders.NFTCreateBuilder()
				.NFTCreateToken({
					collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
					attributes: {
						number: 5,
						string: "something",
					},
				})
				.sign(passphrases[0]!)
				.build();

			const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
				Container.Identifiers.WalletRepository,
				"state",
				"blockchain",
			);

			const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(passphrases[0]!));

			const tokensWallet = wallet.getAttribute<Interfaces.INFTTokens>("nft.base.tokenIds", []);
			// @ts-ignore
			tokensWallet[nftToken.data.id] = {};
			wallet.setAttribute<Interfaces.INFTTokens>("nft.base.tokenIds", tokensWallet);
			walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);

			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
				results: [{ ...nftToken.data, serialized: nftToken.serialized }],
				totalCount: 1,
				meta: { totalCountIsEstimate: false },
			});

			const response = await api.request("GET", `nft/collections/${nftToken.id}/assets`, { transform: false });
			console.log(response.data.data);
			expect(response).toBeSuccessfulResponse();
			expect(response.data.data[0]!.id).toStrictEqual(nftToken.id);
			expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftToken.data.senderPublicKey);
			expect(response.data.data[0]!.asset.nftToken.collectionId).toStrictEqual(
				"5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
			);
			expect(response.data.data[0]!.asset.nftToken.attributes).toBeObject();
		});
	});
});
