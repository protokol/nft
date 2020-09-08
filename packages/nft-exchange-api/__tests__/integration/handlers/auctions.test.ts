import "@arkecosystem/core-test-framework/src/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework/src";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Identities, Utils } from "@arkecosystem/crypto";
import { NFTExchangeTransactionFactory } from "@protokol/nft-exchange-transactions/__tests__/functional/transaction-forging/__support__/transaction-factory";
import { INFTAuctions } from "@protokol/nft-exchange-transactions/src/interfaces";

import { setUp, tearDown } from "../__support__/setup";
import { NFTExchangeIndexers } from "../../../../nft-exchange-transactions/src/wallet-indexes";

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
            nftAuction = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuction({
                    nftIds: ["86b2f1e40bd913627cd3d27d1c090176370ca591e238bee7f65292b4483f9cb6"],
                    expiration: {
                        blockHeight: 100,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                })
                .withPassphrase(secrets[10])
                .build()[0];
        });
        describe("GET /auctions", () => {
            it("should return all auction transactions", async () => {
                const transactionRepository = app.get<Repositories.TransactionRepository>(
                    Container.Identifiers.DatabaseTransactionRepository,
                );

                jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                    rows: [{ ...nftAuction.data, serialized: nftAuction.serialized }],
                    count: 1,
                    countIsEstimate: false,
                });

                const response = await api.request("GET", "nft/exchange/auctions", { transform: false });
                api.expectPaginator(response);
                expect(response.data.data).toBeArray();
                expect(response.data.data[0].id).toStrictEqual(nftAuction.id);
                expect(response.data.data[0].senderPublicKey).toStrictEqual(nftAuction.data.senderPublicKey);
                expect(response.data.data[0].asset.nftAuction).toBeObject();
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

            it("should return wallet by auctions id ", async () => {
                walletRepository = app.getTagged<Contracts.State.WalletRepository>(
                    Container.Identifiers.WalletRepository,
                    "state",
                    "blockchain",
                );
                walletRepository.reset();
                const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(secrets[0]));

                const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});

                auctionsAsset[nftAuction.id] = {
                    nftIds: ["86b2f1e40bd913627cd3d27d1c090176370ca591e238bee7f65292b4483f9cb6"],
                    bids: [],
                };
                wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
                walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);

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
                    rows: [{ ...nftAuction.data, serialized: nftAuction.serialized }],
                    count: 1,
                    countIsEstimate: false,
                });

                const response = await api.request("POST", "nft/exchange/auctions/search?transform=false", {
                    senderPublicKey: nftAuction.data.senderPublicKey,
                });
                api.expectPaginator(response);
                expect(response.data.data).toBeArray();
                expect(response.data.data[0].id).toStrictEqual(nftAuction.id);
                expect(response.data.data[0].senderPublicKey).toStrictEqual(nftAuction.data.senderPublicKey);
                expect(response.data.data[0].asset.nftAuction).toBeObject();
            });
        });
    });

    describe("Auction canceled transactions", () => {
        let nftAuctionCancel;
        beforeEach(async () => {
            nftAuctionCancel = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuctionCancel({
                    auctionId: "86b2f1e40bd913627cd3d27d1c090176370ca591e238bee7f65292b4483f9cb6",
                })
                .withPassphrase(secrets[0])
                .build()[0];
        });
        describe("GET /auctions/canceled", () => {
            it("should return all auction canceled transactions", async () => {
                const transactionRepository = app.get<Repositories.TransactionRepository>(
                    Container.Identifiers.DatabaseTransactionRepository,
                );

                jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                    rows: [{ ...nftAuctionCancel.data, serialized: nftAuctionCancel.serialized }],
                    count: 1,
                    countIsEstimate: false,
                });

                const response = await api.request("GET", "nft/exchange/auctions/canceled", { transform: false });
                api.expectPaginator(response);
                expect(response.data.data).toBeArray();
                expect(response.data.data[0].id).toStrictEqual(nftAuctionCancel.id);
                expect(response.data.data[0].senderPublicKey).toStrictEqual(nftAuctionCancel.data.senderPublicKey);
                expect(response.data.data[0].asset.nftAuctionCancel).toBeObject();
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
