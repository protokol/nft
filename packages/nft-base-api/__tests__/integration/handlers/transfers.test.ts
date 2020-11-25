import "@arkecosystem/core-test-framework/dist/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers, passphrases } from "@arkecosystem/core-test-framework";
import { Identities } from "@arkecosystem/crypto";
import { Builders as NFTBuilders } from "@protokol/nft-base-crypto";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
	app = await setUp();
	api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Transfers", () => {
	let nftTransfer;
	beforeEach(async () => {
		nftTransfer = new NFTBuilders.NFTTransferBuilder()
			.NFTTransferAsset({
				nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
				recipientId: Identities.Address.fromPassphrase(passphrases[1]!),
			})
			.sign(passphrases[0]!)
			.build();
	});
	describe("GET /transfers", () => {
		it("should return all transfer transactions", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
				results: [{ ...nftTransfer.data, serialized: nftTransfer.serialized }],
				totalCount: 1,
				meta: { totalCountIsEstimate: false },
			});
			const response = await api.request("GET", "nft/transfers", { transform: false });

			expect(response.data.data[0]!.id).toStrictEqual(nftTransfer.id);
			expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftTransfer.data.senderPublicKey);
			expect(response.data.data[0]!.asset.nftTransfer.nftIds).toStrictEqual([
				"dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
			]);
			expect(response.data.data[0]!.asset.nftTransfer.recipientId).toStrictEqual(
				Identities.Address.fromPassphrase(passphrases[1]!),
			);
		});
	});

	describe("GET /transfers/{id}", () => {
		it("should return specific transfer transaction by its id", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
				{
					...nftTransfer.data,
					serialized: nftTransfer.serialized,
				},
			]);

			const response = await api.request("GET", `nft/transfers/${nftTransfer.id}`);

			expect(response.data.data.id).toStrictEqual(nftTransfer.id);
			expect(response.data.data.senderPublicKey).toStrictEqual(nftTransfer.data.senderPublicKey);
			expect(response.data.data.nftTransfer.nftIds).toStrictEqual([
				"dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
			]);
			expect(response.data.data.nftTransfer.recipientId).toStrictEqual(
				Identities.Address.fromPassphrase(passphrases[1]!),
			);
		});
	});
});
