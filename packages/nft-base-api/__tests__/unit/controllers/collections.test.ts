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
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { INFTCollections, INFTTokens } from "@protokol/nft-base-transactions/src/interfaces";

import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { CollectionsController } from "../../../src/controllers/collections";

let app: Application;

let collectionController: CollectionsController;

let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

const transactionHistoryService = {
    findManyByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
    listByCriteria: jest.fn(),
};

let actual: ITransaction;

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

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    senderWallet = buildSenderWallet(app);

    transactionHistoryService.findManyByCriteria.mockReset();
    transactionHistoryService.findOneByCriteria.mockReset();
    transactionHistoryService.listByCriteria.mockReset();

    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    collectionController = app.resolve<CollectionsController>(CollectionsController);

    actual = new Builders.NFTRegisterCollectionBuilder()
        .NFTRegisterCollectionAsset({
            name: "Heartstone card",
            description: "A card from heartstone game",
            maximumSupply: 100,
            jsonSchema: {
                properties: {
                    number: {
                        type: "number",
                    },
                    string: { type: "string" },
                },
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
});

describe("Test collection controller", () => {
    it("index - return all collections", async () => {
        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
            },
        };
        const response = (await collectionController.index(request, undefined)) as PaginatedResponse;

        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            name: "Heartstone card",
            description: "A card from heartstone game",
            maximumSupply: 100,
            jsonSchema: {
                properties: {
                    number: {
                        type: "number",
                    },
                    string: { type: "string" },
                },
            },
        });
    });

    it("showByWalletId - return wallet by collectionId", async () => {
        const collectionsWallet = senderWallet.getAttribute<INFTCollections>("nft.base.collections", {});
        collectionsWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
            currentSupply: 0,
            nftCollectionAsset: nftCollectionAsset,
        };
        senderWallet.setAttribute("nft.base.collections", collectionsWallet);
        walletRepository.index(senderWallet);

        const request: Hapi.Request = {
            params: {
                id: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            },
        };

        const response = (await collectionController.showByWalletId(request, undefined)) as ItemResponse;

        expect(response.data).toStrictEqual({
            address: senderWallet.address,
            publicKey: senderWallet.publicKey,
            nft: {
                collections: {
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61": {
                        currentSupply: 0,
                        nftCollectionAsset: nftCollectionAsset,
                    },
                },
                assetsIds: [],
            },
        });
    });

    it("show - return specific collection transaction", async () => {
        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);

        const request: Hapi.Request = {
            params: {
                id: actual.id,
            },
        };

        const response = (await collectionController.show(request, undefined)) as ItemResponse;
        expect(response.data).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            name: "Heartstone card",
            description: "A card from heartstone game",
            maximumSupply: 100,
            jsonSchema: {
                properties: {
                    number: {
                        type: "number",
                    },
                    string: { type: "string" },
                },
            },
        });
    });

    it("showSchema - return schema by specific id", async () => {
        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);

        const request: Hapi.Request = {
            params: {
                id: actual.id,
            },
        };

        const response = (await collectionController.showSchema(request, undefined)) as ItemResponse;
        expect(response.data).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            properties: {
                number: {
                    type: "number",
                },
                string: { type: "string" },
            },
        });
    });

    it("searchCollection - search collection by payload", async () => {
        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });
        const request: Hapi.Request = {
            payload: {
                type: "number",
            },
            query: {
                page: 1,
                limit: 100,
            },
        };

        const response = (await collectionController.searchCollection(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            name: "Heartstone card",
            description: "A card from heartstone game",
            maximumSupply: 100,
            jsonSchema: {
                properties: {
                    number: {
                        type: "number",
                    },
                    string: { type: "string" },
                },
            },
        });
    });

    it("showAssetsByCollectionId - returns nftTokens by collection id", async () => {
        const actual = new Builders.NFTCreateBuilder()
            .NFTCreateToken({
                collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                attributes: {
                    number: 5,
                    string: "something",
                },
            })
            .sign(passphrases[0])
            .build();

        const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        // @ts-ignore
        tokensWallet[actual.id] = {};
        senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
        walletRepository.index(senderWallet);

        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const request: Hapi.Request = {
            params: {
                id: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
            },
            query: {
                page: 1,
                limit: 100,
            },
        };
        const response = (await collectionController.showAssetsByCollectionId(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            ownerPublicKey: actual.data.senderPublicKey,
            senderPublicKey: actual.data.senderPublicKey,
            collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
            attributes: {
                number: 5,
                string: "something",
            },
        });
    });
});
