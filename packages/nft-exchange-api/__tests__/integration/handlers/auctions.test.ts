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

describe("API - Auctions", () => {
	describe("Auction transactions", () => {
		let nftAuction;
		beforeEach(async () => {
			nftAuction = new NFTExchangeBuilders.NFTAuctionBuilder()
				.NFTAuctionAsset({
					nftIds: ["86b2f1e40bd913627cd3d27d1c090176370ca591e238bee7f65292b4483f9cb6"],
					expiration: {
						blockHeight: 100,
					},
					startAmount: Utils.BigNumber.make("1"),
				})
				.sign(passphrases[10]!)
				.build();
		});
		describe("GET /auctions", () => {
			it("should return all auction transactions", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
					results: [{ ...nftAuction.data, serialized: nftAuction.serialized }],
					totalCount: 1,
					meta: { totalCountIsEstimate: false },
				});

				const response = await api.request("GET", "nft/exchange/auctions", { transform: false });
				api.expectPaginator(response);
				expect(response.data.data).toBeArray();
				expect(response.data.data[0]!.id).toStrictEqual(nftAuction.id);
				expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftAuction.data.senderPublicKey);
				expect(response.data.data[0]!.asset.nftAuction).toBeObject();
			});
		});

		describe("GET /auctions/{id}", () => {
			it("should return specific auction by its id", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
					{
						...nftAuction.data,
						serialized: nftAuction.serialized,
					},
				]);
				const response = await api.request("GET", `nft/exchange/auctions/${nftAuction.id}`);
				expect(response.data.data.id).toStrictEqual(nftAuction.id);
				expect(response.data.data.senderPublicKey).toStrictEqual(nftAuction.data.senderPublicKey);
				expect(response.data.data.nftAuction).toBeObject();
			});
		});

		describe("GET /auctions/{id}/wallets", () => {
			let walletRepository: Contracts.State.WalletRepository;

			it("should return wallet by auctions id", async () => {
				walletRepository = app.getTagged<Contracts.State.WalletRepository>(
					Container.Identifiers.WalletRepository,
					"state",
					"blockchain",
				);
				walletRepository.reset();
				const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(passphrases[0]!));

				const auctionsAsset = wallet.getAttribute<Interfaces.INFTAuctions>("nft.exchange.auctions", {});

				auctionsAsset[nftAuction.id] = {
					nftIds: ["86b2f1e40bd913627cd3d27d1c090176370ca591e238bee7f65292b4483f9cb6"],
					bids: [],
				};
				wallet.setAttribute<Interfaces.INFTAuctions>("nft.exchange.auctions", auctionsAsset);
				walletRepository.getIndex(Indexers.NFTExchangeIndexers.AuctionIndexer).index(wallet);

				const response = await api.request("GET", `nft/exchange/auctions/${nftAuction.id}/wallets`);
				expect(response.data.data).toBeObject();
			});
		});

		describe("POST /auctions/search", () => {
			it("should search auctions", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
					results: [{ ...nftAuction.data, serialized: nftAuction.serialized }],
					totalCount: 1,
					meta: { totalCountIsEstimate: false },
				});

				const response = await api.request("POST", "nft/exchange/auctions/search?transform=false", {
					senderPublicKey: nftAuction.data.senderPublicKey,
				});
				api.expectPaginator(response);
				expect(response.data.data).toBeArray();
				expect(response.data.data[0]!.id).toStrictEqual(nftAuction.id);
				expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftAuction.data.senderPublicKey);
				expect(response.data.data[0]!.asset.nftAuction).toBeObject();
			});
		});
	});

	describe("Auction canceled transactions", () => {
		let nftAuctionCancel;
		beforeEach(async () => {
			nftAuctionCancel = new NFTExchangeBuilders.NFTAuctionCancelBuilder()
				.NFTAuctionCancelAsset({
					auctionId: "86b2f1e40bd913627cd3d27d1c090176370ca591e238bee7f65292b4483f9cb6",
				})
				.sign(passphrases[0]!)
				.build();
		});
		describe("GET /auctions/canceled", () => {
			it("should return all auction canceled transactions", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
					results: [{ ...nftAuctionCancel.data, serialized: nftAuctionCancel.serialized }],
					totalCount: 1,
					meta: { totalCountIsEstimate: false },
				});

				const response = await api.request("GET", "nft/exchange/auctions/canceled", { transform: false });
				api.expectPaginator(response);
				expect(response.data.data).toBeArray();
				expect(response.data.data[0]!.id).toStrictEqual(nftAuctionCancel.id);
				expect(response.data.data[0]!.senderPublicKey).toStrictEqual(nftAuctionCancel.data.senderPublicKey);
				expect(response.data.data[0]!.asset.nftAuctionCancel).toBeObject();
			});
		});

		describe("GET /auctions/canceled/{id}", () => {
			it("should return canceled transaction by its id", async () => {
				const transactionRepository = app.get<Repositories.TransactionRepository>(
					Container.Identifiers.DatabaseTransactionRepository,
				);

				jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
					{
						...nftAuctionCancel.data,
						serialized: nftAuctionCancel.serialized,
					},
				]);
				const response = await api.request("GET", `nft/exchange/auctions/canceled/${nftAuctionCancel.id}`);
				expect(response.data.data.id).toStrictEqual(nftAuctionCancel.id);
				expect(response.data.data.senderPublicKey).toStrictEqual(nftAuctionCancel.data.senderPublicKey);
				expect(response.data.data.nftAuctionCancel).toBeObject();
			});
		});
	});
});
