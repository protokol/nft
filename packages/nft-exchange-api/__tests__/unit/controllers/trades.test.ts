import "jest-extended";

import { Application, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { Builders, Transactions as ExchangeTransactions } from "@protokol/nft-exchange-crypto";

import { TradesController } from "../../../src/controllers/trades";
import {
	blockHistoryService,
	ErrorResponse,
	initApp,
	ItemResponse,
	PaginatedResponse,
	transactionHistoryService,
} from "../__support__";

let tradesController: TradesController;

let app: Application;

let actual: Interfaces.ITransaction;

const timestamp = AppUtils.formatTimestamp(104930456);

beforeEach(() => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);

	app = initApp();

	tradesController = app.resolve<TradesController>(TradesController);

	actual = new Builders.NftAcceptTradeBuilder()
		.NFTAcceptTradeAsset({
			auctionId: "ec0f6ad8ff46c844e25ec31d49e9b166d8a0fef3d365621d39a86d73a244354c",
			bidId: "c12f814ab08bb82be251622aeb35fd72d9c7632828b91cab38c458ead8c782a9",
		})
		.sign(passphrases[0]!)
		.build();
});

afterEach(() => {
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTRegisterCollectionTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTCreateTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTTransferTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBurnTransaction);

	Transactions.TransactionRegistry.deregisterTransactionType(ExchangeTransactions.NFTAuctionTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(ExchangeTransactions.NFTAuctionCancelTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(ExchangeTransactions.NFTBidTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(ExchangeTransactions.NFTBidCancelTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(ExchangeTransactions.NFTAcceptTradeTransaction);
});

describe("Test trades controller", () => {
	it("index - returns all trade transactions", async () => {
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

		const response = (await tradesController.index(request, undefined)) as PaginatedResponse;

		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			completedTrade: {
				auctionId: actual.data.asset!.nftAcceptTrade.auctionId,
				bidId: actual.data.asset!.nftAcceptTrade.bidId,
			},
			timestamp,
		});
	});

	describe("Get trade by id", () => {
		it("should return 404 - NotFound for non existing id", async () => {
			const request: Hapi.Request = {
				params: {
					id: actual.id,
				},
			};

			const response = (await tradesController.show(request, undefined)) as ErrorResponse;

			expect(response.output.statusCode).toEqual(404);
		});

		it("show - specific trade and its bids and auction by its id", async () => {
			const auction = new Builders.NFTAuctionBuilder()
				.NFTAuctionAsset({
					nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
					startAmount: Utils.BigNumber.make("1"),
					expiration: {
						blockHeight: 1,
					},
				})
				.sign(passphrases[0]!)
				.build();
			const bid = new Builders.NFTBidBuilder()
				.NFTBidAsset({
					auctionId: actual.data.asset!.nftAcceptTrade.auctionId,
					bidAmount: Utils.BigNumber.make("1"),
				})
				.sign(passphrases[0]!)
				.build();
			transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);
			transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([auction.data, bid.data]);
			blockHistoryService.findOneByCriteria.mockResolvedValueOnce({ timestamp: timestamp.epoch });

			const request: Hapi.Request = {
				query: {
					transform: true,
				},
				params: {
					id: actual.id,
				},
			};

			const response = (await tradesController.show(request, undefined)) as ItemResponse;

			expect(response.data).toStrictEqual({
				id: actual.id,
				senderPublicKey: actual.data.senderPublicKey,
				completedTrade: {
					auction: {
						id: auction.data.id,
						...auction.data.asset!.nftAuction,
					},
					bid: {
						id: bid.data.id,
						...bid.data.asset!.nftBid,
					},
				},
				timestamp,
			});
		});
	});

	it("search - by senderPublicKey, auctionId or bidId", async () => {
		const request: Hapi.Request = {
			payload: {},
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
		};
		const requestWithPublicKey: Hapi.Request = AppUtils.cloneDeep(request);
		requestWithPublicKey.payload.senderPublicKey = actual.data.senderPublicKey;

		const requestWithAuctionId: Hapi.Request = AppUtils.cloneDeep(request);
		requestWithAuctionId.payload.auctionId = actual.data.asset!.nftAcceptTrade.auctionId;

		const requestWithBidId: Hapi.Request = AppUtils.cloneDeep(request);
		requestWithBidId.payload.bidId = actual.data.asset!.nftAcceptTrade.bidId;

		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValue({
			results: [{ data: actual.data, block: { timestamp: timestamp.epoch } }],
		});

		const expectedResponse = {
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			completedTrade: {
				auctionId: actual.data.asset!.nftAcceptTrade.auctionId,
				bidId: actual.data.asset!.nftAcceptTrade.bidId,
			},
			timestamp,
		};

		// search by public key
		const responseByPublicKey = (await tradesController.search(
			requestWithPublicKey,
			undefined,
		)) as PaginatedResponse;
		expect(responseByPublicKey.results[0]!).toStrictEqual(expectedResponse);

		// search by auction id
		const responseByAuctionId = (await tradesController.search(
			requestWithAuctionId,
			undefined,
		)) as PaginatedResponse;
		expect(responseByAuctionId.results[0]!).toStrictEqual(expectedResponse);

		// search by bid id
		const responseByBidId = (await tradesController.search(requestWithBidId, undefined)) as PaginatedResponse;
		expect(responseByBidId.results[0]!).toStrictEqual(expectedResponse);
	});
});
