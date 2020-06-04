import "@arkecosystem/core-test-framework/src/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework/src";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Identities } from "@arkecosystem/crypto";
import { NFTBaseTransactionFactory } from "@protokol/nft-base-transactions/__tests__/functional/transaction-forging/__support__/transaction-factory";
import { INFTCollections } from "@protokol/nft-base-transactions/src/interfaces";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Collections", () => {
    let nftRegisteredCollection;
    beforeEach(async () => {
        nftRegisteredCollection = NFTBaseTransactionFactory.initialize(app)
            .NFTRegisterCollection({
                name: "Nft card",
                description: "Nft card description",
                maximumSupply: 100,
                jsonSchema: {
                    properties: {
                        name: {
                            type: "string",
                        },
                        damage: {
                            type: "integer",
                        },
                        health: {
                            type: "integer",
                        },
                        mana: {
                            type: "integer",
                        },
                    },
                },
            })
            .withPassphrase(secrets[0])
            .build()[0];
    });
    describe("GET /nft/collections", () => {
        it("should GET get all nft collections transactions", async () => {
            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                rows: [{ ...nftRegisteredCollection.data, serialized: nftRegisteredCollection.serialized }],
                count: 1,
                countIsEstimate: false,
            });

            const response = await api.request("GET", "nft/collections");

            expect(response).toBeSuccessfulResponse();
            api.expectPaginator(response);
            expect(response.data.data).toBeArray();
            expect(response.data.data[0].id).toStrictEqual(nftRegisteredCollection.id);
            expect(response.data.data[0].ownerPublicKey).toStrictEqual(nftRegisteredCollection.data.senderPublicKey);
            expect(response.data.data[0].name).toStrictEqual("Nft card");
            expect(response.data.data[0].description).toStrictEqual("Nft card description");
            expect(response.data.data[0].maximumSupply).toStrictEqual(100);
            expect(response.data.data[0].jsonSchema).toBeObject();
        });
    });

    describe("GET /collections/{id}", () => {
        it("should return specific id", async () => {
            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
                {
                    ...nftRegisteredCollection.data,
                    serialized: nftRegisteredCollection.serialized,
                },
            ]);

            const response = await api.request("GET", `nft/collections/${nftRegisteredCollection.id}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data.id).toBe(nftRegisteredCollection.id);
            expect(response.data.data.ownerPublicKey).toStrictEqual(nftRegisteredCollection.data.senderPublicKey);
            expect(response.data.data.name).toStrictEqual("Nft card");
            expect(response.data.data.description).toStrictEqual("Nft card description");
            expect(response.data.data.maximumSupply).toStrictEqual(100);
            expect(response.data.data.jsonSchema).toBeObject();
        });
    });

    describe("GET /collections/{id}/schema", () => {
        it("should return schema by id", async () => {
            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
                {
                    ...nftRegisteredCollection.data,
                    serialized: nftRegisteredCollection.serialized,
                },
            ]);

            const response = await api.request("GET", `nft/collections/${nftRegisteredCollection.id}/schema`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data.id).toBe(nftRegisteredCollection.id);
            expect(response.data.data.senderPublicKey).toBe(nftRegisteredCollection.data.senderPublicKey);
            expect(response.data.data.properties).toBeObject();
        });
    });

    describe("GET /collections/{id}/wallets", () => {
        let walletRepository: Contracts.State.WalletRepository;
        const nftCollectionAsset = {
            name: "Nft card",
            description: "Nft card description",
            maximumSupply: 100,
            jsonSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    name: {
                        type: "string",
                        minLength: 3,
                    },
                    damage: {
                        type: "integer",
                    },
                    health: {
                        type: "integer",
                    },
                    mana: {
                        type: "integer",
                    },
                },
            },
        };
        it("should return wallet by collection id", async () => {
            walletRepository = app.getTagged<Contracts.State.WalletRepository>(
                Container.Identifiers.WalletRepository,
                "state",
                "blockchain",
            );
            walletRepository.reset();
            const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(secrets[0]));

            const collectionsWallet = wallet.getAttribute<INFTCollections>("nft.base.collections", {});
            collectionsWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                currentSupply: 0,
                nftCollectionAsset: nftCollectionAsset,
            };
            wallet.setAttribute("nft.base.collections", collectionsWallet);

            walletRepository.index(wallet);

            const response = await api.request(
                "GET",
                `nft/collections/8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61/wallets`,
            );
            expect(response).toBeSuccessfulResponse();
        });
    });

    describe("POST /collections/search", () => {
        it("should search collection", async () => {
            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                rows: [{ ...nftRegisteredCollection.data, serialized: nftRegisteredCollection.serialized }],
                count: 1,
                countIsEstimate: false,
            });

            const response = await api.request("POST", "nft/collections/search", {
                type: "number",
            });
            expect(response).toBeSuccessfulResponse();
            api.expectPaginator(response);
            expect(response.data.data).toBeArray();
            expect(response.data.data[0].id).toStrictEqual(nftRegisteredCollection.id);
            expect(response.data.data[0].ownerPublicKey).toStrictEqual(nftRegisteredCollection.data.senderPublicKey);
            expect(response.data.data[0].name).toStrictEqual("Nft card");
            expect(response.data.data[0].description).toStrictEqual("Nft card description");
            expect(response.data.data[0].maximumSupply).toStrictEqual(100);
            expect(response.data.data[0].jsonSchema).toBeObject();
        });
    });

    describe("POST /collections/{id}/assets", () => {
        let nftToken;
        it("should find assets by collection id", async () => {
            nftToken = NFTBaseTransactionFactory.initialize(app)
                .NFTCreate({
                    collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                    attributes: {
                        number: 5,
                        string: "something",
                    },
                })
                .withPassphrase(secrets[0])
                .build()[0];

            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                rows: [{ ...nftToken.data, serialized: nftToken.serialized }],
                count: 1,
                countIsEstimate: false,
            });

            const response = await api.request("GET", `nft/collections/${nftToken.id}/assets`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data[0].id).toStrictEqual(nftToken.id);
            expect(response.data.data[0].ownerPublicKey).toStrictEqual(nftToken.data.senderPublicKey);
            expect(response.data.data[0].collectionId).toStrictEqual(
                "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
            );
            expect(response.data.data[0].attributes).toBeObject();
        });
    });
});
