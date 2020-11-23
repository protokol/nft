import "@arkecosystem/core-test-framework/dist/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers, passphrases } from "@arkecosystem/core-test-framework";
import { Identities, Utils } from "@arkecosystem/crypto";
import { Builders as NFTExchangeBuilders } from "@protokol/nft-exchange-crypto";
import { Indexers, Interfaces } from "@protokol/nft-exchange-transactions";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
	app = await setUp();
	api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Bids", () => {
	describe("Bids transactions", () => {
		let nftBid;
		beforeEach(async () => {
			nftBid = new NFTExchangeBuilders.NFTBidBuilder()
				.NFTBidAsset({
					auctionId: "86b2f1e40bd913627cd3d27d1c090176370ca591e238bee7f65292b4483f9cb6",
					bidAmount: Utils.BigNumber.make("1"),
				})
				.sign(passphrases[10]!)
				.build();
		});

		describe("GET /bids", () => {
			it("should return all bids", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
					results: [{ ...nftBid.data, serialized: nftBid.serialized }],
					totalCount: 1,
					meta: { totalCountIsEstimate: false },
				});

				const response = await api.request("GET", "nft/exchange/bids", { transform: false });
				api.expectPaginator(response);
				expect(response.data.data).toBeArray();
				expect(response.data.data[0]!.id).toStrictEqual(nftBid.id);
				expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftBid.data.senderPublicKey);
				expect(response.data.data[0]!.asset.nftBid).toBeObject();
			});
		});

		describe("GET /bids/{id}", () => {
			it("should return specific bid by id", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
					{
						...nftBid.data,
						serialized: nftBid.serialized,
					},
				]);
				const response = await api.request("GET", `nft/exchange/bids/${nftBid.id}`);
				expect(response.data.data.id).toStrictEqual(nftBid.id);
				expect(response.data.data.senderPublicKey).toStrictEqual(nftBid.data.senderPublicKey);
				expect(response.data.data.nftBid).toBeObject();
			});
		});

		describe("GET /bids/{id}/wallets", () => {
			let walletRepository: Contracts.State.WalletRepository;
			it("should return wallet by bid id", async () => {
				walletRepository = app.getTagged<Contracts.State.WalletRepository>(
					Container.Identifiers.WalletRepository,
					"state",
					"blockchain",
				);
				walletRepository.reset();
				const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(passphrases[0]!));

				const auctionsAsset = wallet.getAttribute<Interfaces.INFTAuctions>("nft.exchange.auctions", {});
				auctionsAsset["939e70261392c98bff8e11b176267e0b313a5fa22e24711b900babc977798466"] = {
					nftIds: ["86b2f1e40bd913627cd3d27d1c090176370ca591e238bee7f65292b4483f9cb6"],
					bids: [nftBid.id],
				};
				wallet.setAttribute<Interfaces.INFTAuctions>("nft.exchange.auctions", auctionsAsset);
				walletRepository.getIndex(Indexers.NFTExchangeIndexers.AuctionIndexer).index(wallet);
				walletRepository.getIndex(Indexers.NFTExchangeIndexers.BidIndexer).index(wallet);

				const response = await api.request("GET", `nft/exchange/bids/${nftBid.id}/wallets`);
				expect(response.data.data).toBeObject();
			});
		});

		describe("POST /bids/search", () => {
			it("should search bids", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
					results: [{ ...nftBid.data, serialized: nftBid.serialized }],
					totalCount: 1,
					meta: { totalCountIsEstimate: false },
				});

				const response = await api.request("POST", "nft/exchange/bids/search?transform=false", {
					senderPublicKey: nftBid.data.senderPublicKey,
				});
				api.expectPaginator(response);
				expect(response.data.data).toBeArray();
				expect(response.data.data[0]!.id).toStrictEqual(nftBid.id);
				expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftBid.data.senderPublicKey);
				expect(response.data.data[0]!.asset.nftBid).toBeObject();
			});
		});
	});

	describe("Bids canceled transactions", () => {
		let nftBidCancel;
		beforeEach(async () => {
			nftBidCancel = new NFTExchangeBuilders.NFTBidCancelBuilder()
				.NFTBidCancelAsset({
					bidId: "c791bead8ee3a43faaa62d04ba4fce0d5df002f6493a2ad9af72b16bf66ad793",
				})
				.sign(passphrases[0]!)
				.build();
		});

		describe("GET /bids/canceled", () => {
			it("should return all bid cancel transactions", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
					results: [{ ...nftBidCancel.data, serialized: nftBidCancel.serialized }],
					totalCount: 1,
					meta: { totalCountIsEstimate: false },
				});

				const response = await api.request("GET", "nft/exchange/bids/canceled", { transform: false });
				api.expectPaginator(response);
				expect(response.data.data).toBeArray();
				expect(response.data.data[0]!.id).toStrictEqual(nftBidCancel.id);
				expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftBidCancel.data.senderPublicKey);
				expect(response.data.data[0]!.asset.nftBidCancel).toBeObject();
			});
		});

		describe("GET /bids/canceled/{id}", () => {
			it("should return cancel transaction by id", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
					{
						...nftBidCancel.data,
						serialized: nftBidCancel.serialized,
					},
				]);
				const response = await api.request("GET", `nft/exchange/bids/canceled/${nftBidCancel.id}`);
				expect(response.data.data.id).toStrictEqual(nftBidCancel.id);
				expect(response.data.data.senderPublicKey).toStrictEqual(nftBidCancel.data.senderPublicKey);
				expect(response.data.data.nftBidCancel).toBeObject();
			});
		});
	});
});
