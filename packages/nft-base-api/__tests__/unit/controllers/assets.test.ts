import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";
import { ITransaction } from "@arkecosystem/crypto/src/interfaces";
import { configManager } from "@arkecosystem/crypto/src/managers";
import Hapi from "@hapi/hapi";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { INFTTokens } from "@protokol/nft-base-transactions/src/interfaces";

import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { AssetsController } from "../../../src/controllers/assets";

let app: Application;

let assetController: AssetsController;

let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

const transactionHistoryService = {
    findManyByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
    listByCriteria: jest.fn(),
};

let actual: ITransaction;

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

    assetController = app.resolve<AssetsController>(AssetsController);

    actual = new Builders.NFTCreateBuilder()
        .NFTCreateToken({
            collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            attributes: {
                name: "card name",
                damage: 3,
                health: 2,
                mana: 2,
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

describe("Test asset controller", () => {
    it("index - return all nftCreate transactions", async () => {
        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
            },
        };

        const response = (await assetController.index(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
            collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            attributes: {
                name: "card name",
                damage: 3,
                health: 2,
                mana: 2,
            },
        });
    });

    it("showAssetWallet - return wallet by nfts id", async () => {
        const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        // @ts-ignore
        tokensWallet[actual.id] = {};
        senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
        walletRepository.index(senderWallet);

        const request: Hapi.Request = {
            params: {
                id: actual.id,
            },
        };
        const response = (await assetController.showAssetWallet(request, undefined)) as ItemResponse;

        expect(response.data).toStrictEqual({
            address: "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
            publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            nft: {
                assetsIds: [actual.id],
                collections: [],
            },
        });
    });

    it("show - return nftCreate transaction by its id", async () => {
        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);

        const request: Hapi.Request = {
            params: {
                id: actual.id,
            },
        };

        const response = (await assetController.show(request, undefined)) as ItemResponse;

        expect(response.data).toStrictEqual({
            id: actual.id,
            senderPublicKey: senderWallet.publicKey,
            collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            attributes: {
                name: "card name",
                damage: 3,
                health: 2,
                mana: 2,
            },
        });
    });

    it("showByAsset - return transaction by payloads criteria", async () => {
        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });
        const request: Hapi.Request = {
            payload: {
                name: "card name",
            },
            query: {
                page: 1,
                limit: 100,
            },
        };

        const response = (await assetController.showByAsset(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
            collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            attributes: {
                name: "card name",
                damage: 3,
                health: 2,
                mana: 2,
            },
        });
    });
});
