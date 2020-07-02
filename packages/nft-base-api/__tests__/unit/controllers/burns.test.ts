import "jest-extended";

import { Application } from "@arkecosystem/core-kernel";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Managers, Transactions } from "@arkecosystem/crypto";
import { ITransaction } from "@arkecosystem/crypto/src/interfaces";
import { configManager } from "@arkecosystem/crypto/src/managers";
import Hapi from "@hapi/hapi";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import { initApp, ItemResponse, PaginatedResponse, transactionHistoryService } from "../__support__";
import { BurnsController } from "../../../src/controllers/burns";
let app: Application;

let burnsController: BurnsController;

let actual: ITransaction;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    transactionHistoryService.findManyByCriteria.mockReset();
    transactionHistoryService.findOneByCriteria.mockReset();
    transactionHistoryService.listByCriteria.mockReset();

    burnsController = app.resolve<BurnsController>(BurnsController);

    actual = new Builders.NFTBurnBuilder()
        .NFTBurnAsset({
            nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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

describe("Test burns controller", () => {
    it("index - return all burn transactions", async () => {
        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
            },
        };

        const response = (await burnsController.index(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            nftBurn: {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            },
        });
    });

    it("show - return specific burn by its id", async () => {
        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);

        const request: Hapi.Request = {
            params: {
                id: actual.id,
            },
        };

        const response = (await burnsController.show(request, undefined)) as ItemResponse;
        expect(response.data).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            nftBurn: {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            },
        });
    });
});
