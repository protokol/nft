import "jest-extended";

import { Application } from "@arkecosystem/core-kernel";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";
import { ITransaction } from "@arkecosystem/crypto/src/interfaces";
import { configManager } from "@arkecosystem/crypto/src/managers";
import Hapi from "@hapi/hapi";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import { initApp, ItemResponse, PaginatedResponse, transactionHistoryService } from "../__support__";
import { TransfersController } from "../../../src/controllers/transfers";
let app: Application;

let transfersController: TransfersController;

let actual: ITransaction;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    transactionHistoryService.findManyByCriteria.mockReset();
    transactionHistoryService.findOneByCriteria.mockReset();
    transactionHistoryService.listByCriteria.mockReset();

    transfersController = app.resolve<TransfersController>(TransfersController);

    actual = new Builders.NFTTransferBuilder()
        .NFTTransferAsset({
            nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
            recipientId: Identities.Address.fromPassphrase(passphrases[1]),
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

describe("Test transfer controller", () => {
    it("index - return all transfer transactions", async () => {
        transactionHistoryService.listByCriteria.mockResolvedValueOnce({ rows: [actual.data] });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
            },
        };
        const response = (await transfersController.index(request, undefined)) as PaginatedResponse;
        expect(response.results[0]).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            nftTransfer: {
                nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                recipientId: Identities.Address.fromPassphrase(passphrases[1]),
            },
        });
    });

    it("show - return specific transfer transaction by its id", async () => {
        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);

        const request: Hapi.Request = {
            params: {
                id: actual.id,
            },
        };

        const response = (await transfersController.show(request, undefined)) as ItemResponse;
        expect(response.data).toStrictEqual({
            id: actual.id,
            senderPublicKey: actual.data.senderPublicKey,
            nftTransfer: {
                nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                recipientId: Identities.Address.fromPassphrase(passphrases[1]),
            },
        });
    });
});
