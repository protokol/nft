import "jest-extended";

import { Application, Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { Builders, Transactions as ExchangeTransactions } from "@protokol/nft-exchange-crypto";
import { Indexers, Interfaces as NFTInterfaces } from "@protokol/nft-exchange-transactions";

import { BidsController } from "../../../src/controllers/bids";
import {
	blockHistoryService,
	buildSenderWallet,
	initApp,
	ItemResponse,
	PaginatedResponse,
	transactionHistoryService,
} from "../__support__";

let bidsController: BidsController;

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

	bidsController = app.resolve<BidsController>(BidsController);

	actual = new Builders.NFTBidBuilder()
		.NFTBidAsset({
			auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
			bidAmount: Utils.BigNumber.make("1"),
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

describe("Test bids controller", () => {
	it("index - should return all bids", async () => {
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

		const response = (await bidsController.index(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftBid: {
				auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
				bidAmount: Utils.BigNumber.make("1"),
			},
			timestamp,
		});
	});

	it("show - should return bid by its id", async () => {
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

		const response = (await bidsController.show(request, undefined)) as ItemResponse;
		expect(response.data).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftBid: {
				auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
				bidAmount: Utils.BigNumber.make("1"),
			},
			timestamp,
		});
	});

	it("showAuctionWallet - return wallet by bids id", async () => {
		const auctionsAsset = senderWallet.getAttribute<NFTInterfaces.INFTAuctions>("nft.exchange.auctions", {});
		auctionsAsset[actual.id!] = {
			nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
			bids: ["7a8460fdcad40ae3dda9e50382d7676ce5a8643b01c198484a4a99591bcb0871"],
		};
		senderWallet.setAttribute<NFTInterfaces.INFTAuctions>("nft.exchange.auctions", auctionsAsset);
		walletRepository.getIndex(Indexers.NFTExchangeIndexers.AuctionIndexer).index(senderWallet);
		walletRepository.getIndex(Indexers.NFTExchangeIndexers.BidIndexer).index(senderWallet);

		senderWallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.make("100"));

		const request: Hapi.Request = {
			params: {
				id: "7a8460fdcad40ae3dda9e50382d7676ce5a8643b01c198484a4a99591bcb0871",
			},
		};

		const response = (await bidsController.showAuctionWallet(request, undefined)) as ItemResponse;

		expect(response.data).toStrictEqual({
			address: senderWallet.address,
			publicKey: senderWallet.publicKey,
			nft: {
				collections: [],
				auctions: [
					{
						auctionId: actual.id,
						nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
						bids: ["7a8460fdcad40ae3dda9e50382d7676ce5a8643b01c198484a4a99591bcb0871"],
					},
				],
				lockedBalance: "100",
			},
		});
	});

	it("search - by senderPublicKey, auctionId and bidAmount", async () => {
		const request: Hapi.Request = {
			payload: {
				senderPublicKey: actual.data.senderPublicKey,
				auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
				bidAmount: Utils.BigNumber.make("1"),
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
		const response = (await bidsController.search(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftBid: {
				auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
				bidAmount: Utils.BigNumber.make("1"),
			},
			timestamp,
		});
	});

	it("indexCanceled - return all canceled bids", async () => {
		const actualCanceledBid = new Builders.NFTBidCancelBuilder()
			.NFTBidCancelAsset({
				bidId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
			})
			.sign(passphrases[0]!)
			.build();

		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
			results: [{ data: actualCanceledBid.data, block: { timestamp: timestamp.epoch } }],
		});

		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
		};

		const response = (await bidsController.indexCanceled(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actualCanceledBid.id,
			senderPublicKey: actualCanceledBid.data.senderPublicKey,
			nftBidCancel: {
				bidId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
			},
			timestamp,
		});
	});

	it("showAuctionCanceled - return specific canceled bid", async () => {
		const actualCanceledBid = new Builders.NFTBidCancelBuilder()
			.NFTBidCancelAsset({
				bidId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
			})
			.sign(passphrases[0]!)
			.build();

		transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actualCanceledBid.data);
		blockHistoryService.findOneByCriteria.mockResolvedValueOnce({ timestamp: timestamp.epoch });

		const request: Hapi.Request = {
			query: {
				transform: true,
			},
			params: {
				id: actualCanceledBid.id,
			},
		};
		const response = (await bidsController.showAuctionCanceled(request, undefined)) as ItemResponse;
		expect(response.data).toStrictEqual({
			id: actualCanceledBid.id,
			senderPublicKey: actualCanceledBid.data.senderPublicKey,
			nftBidCancel: {
				bidId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
			},
			timestamp,
		});
	});
});
