import "@arkecosystem/core-test-framework/dist/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers, passphrases } from "@arkecosystem/core-test-framework";
import { Utils } from "@arkecosystem/crypto";
import { Builders as NFTExchangeBuilders } from "@protokol/nft-exchange-crypto";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
	app = await setUp();
	api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Trades", () => {
	let nftAcceptTrade;
	beforeEach(async () => {
		nftAcceptTrade = new NFTExchangeBuilders.NftAcceptTradeBuilder()
			.NFTAcceptTradeAsset({
				auctionId: "ec0f6ad8ff46c844e25ec31d49e9b166d8a0fef3d365621d39a86d73a244354c",
				bidId: "c12f814ab08bb82be251622aeb35fd72d9c7632828b91cab38c458ead8c782a9",
			})
			.sign(passphrases[10]!)
			.build();
	});
	describe("GET /trades", () => {
		it("should return all trades transactions", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
				results: [{ ...nftAcceptTrade.data, serialized: nftAcceptTrade.serialized }],
				totalCount: 1,
				meta: { totalCountIsEstimate: false },
			});

			const response = await api.request("GET", "nft/exchange/trades", { transform: false });
			api.expectPaginator(response);
			expect(response.data.data).toBeArray();
			expect(response.data.data[0]!.id).toStrictEqual(nftAcceptTrade.id);
			expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftAcceptTrade.data.senderPublicKey);
			expect(response.data.data[0]!.asset.nftAcceptTrade).toBeObject();
		});
	});

	describe("GET /trades/{id}", () => {
		it("should return specific trade by id", async () => {
			const auction = new NFTExchangeBuilders.NFTAuctionBuilder()
				.NFTAuctionAsset({
					nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
					startAmount: Utils.BigNumber.make("1"),
					expiration: {
						blockHeight: 1,
					},
				})
				.sign(passphrases[0]!)
				.build();

			const bid = new NFTExchangeBuilders.NFTBidBuilder()
				.NFTBidAsset({
					auctionId: nftAcceptTrade.data.asset!.nftAcceptTrade.auctionId,
					bidAmount: Utils.BigNumber.make("1"),
				})
				.sign(passphrases[0]!)
				.build();

			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "findManyByExpression")
				.mockResolvedValueOnce([
					{
						...nftAcceptTrade.data,
						serialized: nftAcceptTrade.serialized,
					},
				])
				.mockResolvedValueOnce([
					// @ts-ignore
					{
						...auction.data,
						serialized: auction.serialized,
					},
					// @ts-ignore
					{
						...bid.data,
						serialized: bid.serialized,
					},
				]);
			const response = await api.request("GET", `nft/exchange/trades/${nftAcceptTrade.id}`);
			expect(response.data.data.id).toStrictEqual(nftAcceptTrade.id);
			expect(response.data.data.senderPublicKey).toStrictEqual(nftAcceptTrade.data.senderPublicKey);
			expect(response.data.data.completedTrade).toBeObject();
		});
	});

	describe("GET /trades/search", () => {
		it("should search trades", async () => {
			const transactionRepository = app.get<Repositories.TransactionRepository>(
				Container.Identifiers.DatabaseTransactionRepository,
			);

			jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
				results: [{ ...nftAcceptTrade.data, serialized: nftAcceptTrade.serialized }],
				totalCount: 1,
				meta: { totalCountIsEstimate: false },
			});

			const response = await api.request("POST", "nft/exchange/trades/search?transform=false", {
				senderPublicKey: nftAcceptTrade.data.senderPublicKey,
			});
			api.expectPaginator(response);
			expect(response.data.data).toBeArray();
			expect(response.data.data[0]!.id).toStrictEqual(nftAcceptTrade.id);
			expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftAcceptTrade.data.senderPublicKey);
			expect(response.data.data[0]!.asset.nftAcceptTrade).toBeObject();
		});
	});
});
