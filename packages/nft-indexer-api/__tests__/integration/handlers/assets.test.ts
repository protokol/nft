import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers, passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";
import { Identities, Interfaces } from "@arkecosystem/crypto";

import { NFTTransactionFactory, setUp, tearDown } from "../__support__";

jest.setTimeout(1200000);

let app: Contracts.Kernel.Application;
let api: ApiHelpers;
let asset1: Interfaces.ITransactionData | undefined, asset2: Interfaces.ITransactionData | undefined;

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
});

afterAll(async () => await tearDown());

describe("API - Assets", () => {
	describe("GET /nft/indexer/assets/wallet/{id}", () => {
		it("should GET nft-indexer-api wallet's assets", async () => {
			const pubKey = Identities.PublicKey.fromPassphrase(passphrases[0]!);
			const response = await api.request("GET", `nft/indexer/assets/wallet/${pubKey}`, { transform: true });

			api.expectPaginator(response);
			expect(response).toBeSuccessfulResponse();
			expect(response.data.data).toBeArray();
			expect(response.data.data.length).toBe(2);
			expect(response.data.data.find((x) => x.id === asset1!.id)).toBeDefined();
			expect(response.data.data.find((x) => x.id === asset2!.id)).toBeDefined();
		});
	});
});
