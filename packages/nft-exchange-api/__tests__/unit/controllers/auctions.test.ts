import "jest-extended";

import { Application, Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { Builders, Transactions as ExchangeTransactions } from "@protokol/nft-exchange-crypto";
import { Indexers, Interfaces as NFTInterfaces } from "@protokol/nft-exchange-transactions";

import { AuctionsController } from "../../../src/controllers/auctions";
import {
	blockHistoryService,
	buildSenderWallet,
	initApp,
	ItemResponse,
	PaginatedResponse,
	transactionHistoryService,
} from "../__support__";

let auctionsController: AuctionsController;

let app: Application;

let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

let actual: Interfaces.ITransaction;

const timestamp = AppUtils.formatTimestamp(104930456);

beforeEach(() => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);

	app = initApp();

	walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

	senderWallet = buildSenderWallet(app);

	auctionsController = app.resolve<AuctionsController>(AuctionsController);

	actual = new Builders.NFTAuctionBuilder()
		.NFTAuctionAsset({
			nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
			startAmount: Utils.BigNumber.make("1"),
			expiration: {
				blockHeight: 1,
			},
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

describe("Test auctions controller", () => {
	it("index - return all auctions", async () => {
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

		const response = (await auctionsController.index(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftAuction: {
				nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
				startAmount: Utils.BigNumber.make("1"),
				expiration: {
					blockHeight: 1,
				},
			},
			timestamp,
		});
	});

	it("show - specific auction by its id", async () => {
		transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);
		blockHistoryService.findOneByCriteria.mockResolvedValueOnce({ timestamp: timestamp.epoch });

		const request: Hapi.Request = {
			query: {
				transform: true,
			},
			params: {
				id: actual.id,
			},
		};

		const response = (await auctionsController.show(request, undefined)) as ItemResponse;

		expect(response.data).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftAuction: {
				nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
				startAmount: Utils.BigNumber.make("1"),
				expiration: {
					blockHeight: 1,
				},
			},
			timestamp,
		});
	});

	it("showAuctionWallet - show auctions wallet by its id", async () => {
		const auctionsAsset = senderWallet.getAttribute<NFTInterfaces.INFTAuctions>("nft.exchange.auctions", {});
		auctionsAsset[actual.id!] = {
			nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
			bids: [],
		};
		senderWallet.setAttribute<NFTInterfaces.INFTAuctions>("nft.exchange.auctions", auctionsAsset);
		walletRepository.getIndex(Indexers.NFTExchangeIndexers.AuctionIndexer).index(senderWallet);

		const request: Hapi.Request = {
			params: {
				id: actual.id,
			},
		};
		const response = (await auctionsController.showAuctionWallet(request, undefined)) as ItemResponse;

		expect(response.data).toStrictEqual({
			address: senderWallet.address,
			publicKey: senderWallet.publicKey,
			nft: {
				collections: [],
				auctions: [
					{
						auctionId: actual.id,
						nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
						bids: [],
					},
				],
				lockedBalance: "0",
			},
		});
	});
	it("search - by senderPublicKey, nftId, startAmount and expiration", async () => {
		const request: Hapi.Request = {
			payload: {
				senderPublicKey: actual.data.senderPublicKey,
				nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
				startAmount: Utils.BigNumber.make("1"),
				expiration: 1,
			},
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
		};

		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
			results: [{ data: actual.data, block: { timestamp: timestamp.epoch } }],
		});

		const response = (await auctionsController.search(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftAuction: {
				nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
				startAmount: Utils.BigNumber.make("1"),
				expiration: {
					blockHeight: 1,
				},
			},
			timestamp,
		});
	});

	it("indexCanceled - return auction cancel transactions", async () => {
		const actualAuctionCanceled = new Builders.NFTAuctionCancelBuilder()
			.NFTAuctionCancelAsset({
				auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
			})
			.sign(passphrases[0]!)
			.build();

		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
			results: [{ data: actualAuctionCanceled.data, block: { timestamp: timestamp.epoch } }],
		});

		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
		};

		const response = (await auctionsController.indexCanceled(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actualAuctionCanceled.id,
			senderPublicKey: actualAuctionCanceled.data.senderPublicKey,
			nftAuctionCancel: {
				auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
			},
			timestamp,
		});
	});

	it("showAuctionCanceled - show specific auction canceled by its id", async () => {
		const actualAuctionCanceled = new Builders.NFTAuctionCancelBuilder()
			.NFTAuctionCancelAsset({
				auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
			})
			.sign(passphrases[0]!)
			.build();
		transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actualAuctionCanceled.data);
		blockHistoryService.findOneByCriteria.mockResolvedValueOnce({ timestamp: timestamp.epoch });

		const request: Hapi.Request = {
			query: {
				transform: true,
			},
			params: {
				id: actualAuctionCanceled.id,
			},
		};

		const response = (await auctionsController.showAuctionCanceled(request, undefined)) as ItemResponse;
		expect(response.data).toStrictEqual({
			id: actualAuctionCanceled.id,
			senderPublicKey: actualAuctionCanceled.data.senderPublicKey,
			nftAuctionCancel: {
				auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
			},
			timestamp,
		});
	});
});
