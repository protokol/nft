import "@arkecosystem/core-test-framework/src/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework/src";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { NFTExchangeTransactionFactory } from "@protokol/nft-exchange-transactions/__tests__/functional/transaction-forging/__support__/transaction-factory";

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
        nftAcceptTrade = NFTExchangeTransactionFactory.initialize(app)
            .NFTAcceptTrade({
                auctionId: "86b2f1e40bd913627cd3d27d1c090176370ca591e238bee7f65292b4483f9cb6",
                bidId: "c791bead8ee3a43faaa62d04ba4fce0d5df002f6493a2ad9af72b16bf66ad793",
            })
            .withPassphrase(secrets[10])
            .build()[0];
    });
    describe("GET /trades", () => {
        it("should return all trades transactions", async () => {
            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                rows: [{ ...nftAcceptTrade.data, serialized: nftAcceptTrade.serialized }],
                count: 1,
                countIsEstimate: false,
            });

            const response = await api.request("GET", "nft/exchange/trades");
            api.expectPaginator(response);
            expect(response.data.data).toBeArray();
            expect(response.data.data[0].id).toStrictEqual(nftAcceptTrade.id);
            expect(response.data.data[0].senderPublicKey).toStrictEqual(nftAcceptTrade.data.senderPublicKey);
            expect(response.data.data[0].completedTrade).toBeObject();
        });
    });

    describe("GET /trades/{id}", () => {
        // TODO: fix implementation so it can be tested
    });

    describe("GET /trades/search", () => {
        it("should search trades", async () => {
            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                rows: [{ ...nftAcceptTrade.data, serialized: nftAcceptTrade.serialized }],
                count: 1,
                countIsEstimate: false,
            });

            const response = await api.request("POST", "nft/exchange/trades/search", {
                senderPublicKey: nftAcceptTrade.data.senderPublicKey,
            });
            api.expectPaginator(response);
            expect(response.data.data).toBeArray();
            expect(response.data.data[0].id).toStrictEqual(nftAcceptTrade.id);
            expect(response.data.data[0].senderPublicKey).toStrictEqual(nftAcceptTrade.data.senderPublicKey);
            expect(response.data.data[0].completedTrade).toBeObject();
        });
    });
});
