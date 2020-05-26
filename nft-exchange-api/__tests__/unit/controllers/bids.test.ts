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
import { NFTExchangeWalletAsset } from "@protokol/nft-exchange-transactions/src/interfaces";

import { initApp, transactionHistoryService } from "../__support__";
import { BidsController } from "../../../src/controllers/bids";

let bidsController: BidsController;

let app: Application;

// @ts-ignore
let senderWallet: Contracts.State.Wallet;
// @ts-ignore
let walletRepository: Wallets.WalletRepository;

let actual: ITransaction;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    senderWallet = buildSenderWallet(app);

    bidsController = app.resolve<BidsController>(BidsController);

    actual = new Builders.NFTBidBuilder()
        .NFTBidAsset({
            auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
            bidAmount: Utils.BigNumber.make("1"),
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

describe("Test bids controller", () => {
    it("index - should return all bids ", async () => {
        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
            },
        };

        const response = (await bidsController.index(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            nftBid: {
                auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                bidAmount: Utils.BigNumber.make("1"),
            },
        });
    });

    it("show - should return bid by its id ", async () => {
        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);

        const request: Hapi.Request = {
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
        });
    });

    it("showAuctionWallet - return wallet by bids id ", async () => {
        senderWallet.setAttribute<NFTExchangeWalletAsset>("nft.exchange", {
            auctions: [
                {
                    nftId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                    // @ts-ignore
                    auctionId: actual.id,
                    bids: ["7a8460fdcad40ae3dda9e50382d7676ce5a8643b01c198484a4a99591bcb0871"],
                },
            ],
        });
        walletRepository.index(senderWallet);

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
                exchange: {
                    auctions: [
                        {
                            nftId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                            // @ts-ignore
                            auctionId: actual.id,
                            bids: ["7a8460fdcad40ae3dda9e50382d7676ce5a8643b01c198484a4a99591bcb0871"],
                        },
                    ],
                },
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
            },
        };

        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });
        const response = (await bidsController.search(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            nftBid: {
                auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                bidAmount: Utils.BigNumber.make("1"),
            },
        });
    });

    it("indexCanceled - return all canceled bids", async () => {
        const actualCanceledBid = new Builders.NFTBidCancelBuilder()
            .NFTBidCancelAsset({
                bidId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
            })
            .sign(passphrases[0])
            .build();

        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actualCanceledBid.data] });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
            },
        };

        const response = (await bidsController.indexCanceled(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actualCanceledBid.id,
            senderPublicKey: actualCanceledBid.data.senderPublicKey,
            nftBidCancel: {
                bidId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
            },
        });
    });

    it("showAuctionCanceled - return specific canceled bid", async () => {
        const actualCanceledBid = new Builders.NFTBidCancelBuilder()
            .NFTBidCancelAsset({
                bidId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
            })
            .sign(passphrases[0])
            .build();

        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actualCanceledBid.data);

        const request: Hapi.Request = {
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
        });
    });
});
