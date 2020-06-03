import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { ITransaction } from "@arkecosystem/crypto/src/interfaces";
import { configManager } from "@arkecosystem/crypto/src/managers";
import Hapi from "@hapi/hapi";
import { buildSenderWallet, ItemResponse, PaginatedResponse } from "@protokol/nft-base-api/__tests__/unit/__support__";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { Builders, Transactions as ExchangeTransactions } from "@protokol/nft-exchange-crypto";
import { INFTAuctions } from "@protokol/nft-exchange-transactions/src/interfaces";

import { initApp, transactionHistoryService } from "../__support__";
import { AuctionsController } from "../../../src/controllers/auctions";

let auctionsController: AuctionsController;

let app: Application;

let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

let actual: ITransaction;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

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
        .sign(passphrases[0])
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
        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
            },
        };

        const response = (await auctionsController.index(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            nftAuction: {
                nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                startAmount: Utils.BigNumber.make("1"),
                expiration: {
                    blockHeight: 1,
                },
            },
        });
    });

    it("show - specific auction by its id ", async () => {
        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);

        const request: Hapi.Request = {
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
        });
    });

    it("showAuctionWallet - show auctions wallet by its id ", async () => {
        const auctionsAsset = senderWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
        // @ts-ignore
        auctionsAsset[actual.id] = {
            nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
            bids: [],
        };
        senderWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
        walletRepository.index(senderWallet);

        const request: Hapi.Request = {
            params: {
                id: actual.id,
            },
        };
        const response = (await auctionsController.showAuctionWallet(request, undefined)) as ItemResponse;

        // @ts-ignore
        expect(response.data.address).toStrictEqual(senderWallet.address);
        // @ts-ignore
        expect(response.data.publicKey).toStrictEqual(senderWallet.publicKey);
        // @ts-ignore
        expect(response.data.nft.exchange.auctions[actual.id].nftIds).toStrictEqual([
            "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
        ]);
        // @ts-ignore
        expect(response.data.nft.exchange.auctions[actual.id].bids).toStrictEqual([]);
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
            },
        };

        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const response = (await auctionsController.search(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            nftAuction: {
                nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                startAmount: Utils.BigNumber.make("1"),
                expiration: {
                    blockHeight: 1,
                },
            },
        });
    });

    it("indexCanceled - return auction cancel transactions", async () => {
        const actualAuctionCanceled = new Builders.NFTAuctionCancelBuilder()
            .NFTAuctionCancelAsset({
                auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
            })
            .sign(passphrases[0])
            .build();

        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actualAuctionCanceled.data] });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
            },
        };

        const response = (await auctionsController.indexCanceled(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actualAuctionCanceled.id,
            senderPublicKey: actualAuctionCanceled.data.senderPublicKey,
            nftAuctionCancel: {
                auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
            },
        });
    });

    it("showAuctionCanceled - show specific auction canceled by its id", async () => {
        const actualAuctionCanceled = new Builders.NFTAuctionCancelBuilder()
            .NFTAuctionCancelAsset({
                auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
            })
            .sign(passphrases[0])
            .build();
        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actualAuctionCanceled.data);

        const request: Hapi.Request = {
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
        });
    });
});
