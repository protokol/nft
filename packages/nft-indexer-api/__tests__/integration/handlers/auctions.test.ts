import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers, passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { NFTTransactionFactory, setUp, tearDown } from "../__support__";

jest.setTimeout(1200000);

let app: Contracts.Kernel.Application;
let api: ApiHelpers;
let asset1: Interfaces.ITransactionData | undefined,
	asset2: Interfaces.ITransactionData | undefined,
	auction1: Interfaces.ITransactionData | undefined,
	auction2: Interfaces.ITransactionData | undefined;

beforeAll(async () => {
	app = await setUp();
	api = new ApiHelpers(app);

	// Register collection
	const nftRegisteredCollection = NFTTransactionFactory.initialize(app)
		.NFTRegisterCollection({
			name: "Nft card",
			description: "Nft card description",
			maximumSupply: 100,
			jsonSchema: {
				properties: {
					name: {
						type: "string",
					},
				},
			},
		})
		.withPassphrase(passphrases[0]!)
		.createOne();

	await api.request("POST", "transactions", { transactions: [nftRegisteredCollection] });
	await snoozeForBlock(1);

	// Create token
	asset1 = NFTTransactionFactory.initialize(app)
		.NFTCreate({
			collectionId: nftRegisteredCollection.id!,
			attributes: {
				name: "card name",
			},
		})
		.withPassphrase(passphrases[0]!)
		.createOne();

	asset2 = NFTTransactionFactory.initialize(app)
		.NFTCreate({
			collectionId: nftRegisteredCollection.id!,
			attributes: {
				name: "card name",
			},
		})
		.withNonce(asset1.nonce!)
		.withPassphrase(passphrases[0]!)
		.createOne();

	await api.request("POST", "transactions", { transactions: [asset1, asset2] });
	await snoozeForBlock(1);

	// Create auction
	auction1 = NFTTransactionFactory.initialize(app)
		.NFTAuction({
			expiration: {
				blockHeight: 50,
			},
			startAmount: Utils.BigNumber.make("1"),
			nftIds: [asset1.id!],
		})
		.withPassphrase(passphrases[0]!)
		.createOne();

	auction2 = NFTTransactionFactory.initialize(app)
		.NFTAuction({
			expiration: {
				blockHeight: 50,
			},
			startAmount: Utils.BigNumber.make("1"),
			nftIds: [asset2.id!],
		})
		.withNonce(auction1.nonce!)
		.withPassphrase(passphrases[0]!)
		.createOne();

	await api.request("POST", "transactions", { transactions: [auction1, auction2] });
	await snoozeForBlock(1);
});

afterAll(async () => await tearDown());

describe("API - Auctions", () => {
	describe("GET /nft/indexer/auctions", () => {
		it("should GET nft-indexer-api auctions", async () => {
			const response = await api.request("GET", `nft/indexer/auctions`);

			api.expectPaginator(response);
			expect(response).toBeSuccessfulResponse();
			expect(response.data.data).toBeArray();
			expect(response.data.data.length).toBe(2);
			expect(response.data.data.find((x) => x.id === auction1!.id)).toBeDefined();
			expect(response.data.data.find((x) => x.id === auction2!.id)).toBeDefined();
		});

		it("should GET nft-indexer-api auctions from overriden endpoint", async () => {
			const responseIndexer = await api.request("GET", `nft/indexer/auctions`);
			const response = await api.request("GET", `nft/exchange/auctions`);

			expect(response.data.data).toStrictEqual(responseIndexer.data.data);
		});
	});

	describe("POST /nft/indexer/auctions/search", () => {
		it("should find nft-indexer-api auctions", async () => {
			const response = await api.request("POST", `nft/indexer/auctions/search`, { nftIds: [asset2!.id!] });

			api.expectPaginator(response);
			expect(response).toBeSuccessfulResponse();
			expect(response.data.data).toBeArray();
			expect(response.data.data.length).toBe(1);
			expect(response.data.data[0]!.id).toBe(auction2!.id);
		});

		it("should find nft-indexer-api auctions from overriden endpoint", async () => {
			const responseIndexer = await api.request("POST", `nft/indexer/auctions/search`, { nftIds: [asset2!.id!] });
			const response = await api.request("POST", `nft/exchange/auctions/search`, { nftIds: [asset2!.id!] });

			expect(response.data.data).toStrictEqual(responseIndexer.data.data);
		});
	});
});
