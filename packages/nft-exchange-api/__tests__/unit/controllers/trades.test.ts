import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Managers, Transactions } from "@arkecosystem/crypto";
import { ITransaction } from "@arkecosystem/crypto/src/interfaces";
import { configManager } from "@arkecosystem/crypto/src/managers";
import Hapi from "@hapi/hapi";
import { buildSenderWallet, PaginatedResponse } from "@protokol/nft-base-api/__tests__/unit/__support__";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { Builders, Transactions as ExchangeTransactions } from "@protokol/nft-exchange-crypto";

import { initApp, transactionHistoryService } from "../__support__";
import { TradesController } from "../../../src/controllers/trades";

let tradesController: TradesController;

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

    tradesController = app.resolve<TradesController>(TradesController);

    actual = new Builders.NftAcceptTradeBuilder()
        .NFTAcceptTradeAsset({
            auctionId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
            bidId: "6fce81fb8dc8aa58f3e25f0f23d1ca04ca9057a54b66ac40335cefbee8d5892b",
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

describe("Test trades controller", () => {
    it("index - returns all trade transactions ", async () => {
        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
            },
        };

        const response = (await tradesController.index(request, undefined)) as PaginatedResponse;

        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            completedTrade: {
                auctionId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
                bidId: "6fce81fb8dc8aa58f3e25f0f23d1ca04ca9057a54b66ac40335cefbee8d5892b",
            },
        });
    });

    it("show - specific trade and its bids and auction by its id", async () => {
        // TODO
    });

    it("search - by senderPublicKey, auctionId and bidId", async () => {
        const request: Hapi.Request = {
            payload: {
                senderPublicKey: actual.data.senderPublicKey,
                auctionId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
                bidId: "6fce81fb8dc8aa58f3e25f0f23d1ca04ca9057a54b66ac40335cefbee8d5892b",
            },
            query: {
                page: 1,
                limit: 100,
            },
        };

        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const response = (await tradesController.search(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            completedTrade: {
                auctionId: "dab749f35c9c43c16f2a9a85b21e69551ae52a630a7fa73ef1d799931b108c2f",
                bidId: "6fce81fb8dc8aa58f3e25f0f23d1ca04ca9057a54b66ac40335cefbee8d5892b",
            },
        });
    });
});
