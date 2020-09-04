import "@arkecosystem/core-test-framework//matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework/src";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { NFTBaseTransactionFactory } from "@protokol/nft-base-transactions/__tests__/functional/transaction-forging/__support__/transaction-factory";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
	app = await setUp();
	api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Burns", () => {
	let nftBurn;
	beforeEach(async () => {
		nftBurn = NFTBaseTransactionFactory.initialize(app)
			.NFTBurn({
				nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			})
			.withPassphrase(secrets[0])
			.build()[0];
	});
	describe("GET /burns", () => {
		it("should return all burn transactions", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
				rows: [{ ...nftBurn.data, serialized: nftBurn.serialized }],
				count: 1,
				countIsEstimate: false,
			});
			const response = await api.request("GET", "nft/burns", { transform: false });

			expect(response.data.data[0].id).toStrictEqual(nftBurn.id);
			expect(response.data.data[0].senderPublicKey).toStrictEqual(nftBurn.data.senderPublicKey);
			expect(response.data.data[0].asset.nftBurn.nftId).toStrictEqual(
				"8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			);
		});
	});

	describe("GET /burns/{id}", () => {
		it("should return specific burn transaction by its id", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
				{
					...nftBurn.data,
					serialized: nftBurn.serialized,
				},
			]);

			const response = await api.request("GET", `nft/burns/${nftBurn.id}`);
			expect(response.data.data.id).toStrictEqual(nftBurn.id);
			expect(response.data.data.senderPublicKey).toStrictEqual(nftBurn.data.senderPublicKey);
			expect(response.data.data.nftBurn.nftId).toStrictEqual(
				"8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			);
		});
	});
});
