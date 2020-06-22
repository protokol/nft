import "@arkecosystem/core-test-framework/src/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework/src";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Utils } from "@arkecosystem/crypto";
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
                auctionId: "b4a8bd68fcd29f8a9bd927b0448d6900f61944a11543b53d975ec20b080b9429",
                bidId: "b1b17cf4c4a3461d784170105c146785b398783ad26e3b2dee1a6481310ff24a",
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
        it("should return specific trade by id", async () => {
            const [auction] = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuction({
                    nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .withPassphrase(secrets[0])
                .build();
            const [bid] = NFTExchangeTransactionFactory.initialize(app)
                .NFTBid({
                    auctionId: nftAcceptTrade.data.asset!.nftAcceptTrade.auctionId,
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .withPassphrase(secrets[0])
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
