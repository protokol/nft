import "@arkecosystem/core-test-framework/src/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework/src";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Identities } from "@arkecosystem/crypto";
import { NFTBaseTransactionFactory } from "@protokol/nft-base-transactions/__tests__/functional/transaction-forging/__support__/transaction-factory";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Transfers", () => {
    let nftTransfer;
    beforeEach(async () => {
        nftTransfer = NFTBaseTransactionFactory.initialize(app)
            .NFTTransfer({
                nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                recipientId: Identities.Address.fromPassphrase(secrets[1]),
            })
            .withPassphrase(secrets[0])
            .build()[0];
    });
    describe("GET /transfers", () => {
        it("should return all transfer transactions", async () => {
            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                rows: [{ ...nftTransfer.data, serialized: nftTransfer.serialized }],
                count: 1,
                countIsEstimate: false,
            });
            const response = await api.request("GET", "nft/transfers");

            expect(response.data.data[0].id).toStrictEqual(nftTransfer.id);
            expect(response.data.data[0].senderPublicKey).toStrictEqual(nftTransfer.data.senderPublicKey);
            expect(response.data.data[0].nftTransfer.nftIds).toStrictEqual([
                "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
            ]);
            expect(response.data.data[0].nftTransfer.recipientId).toStrictEqual(
                Identities.Address.fromPassphrase(secrets[1]),
            );
        });
    });

    describe("GET /transfers/{id}", () => {
        it("should return specific transfer transaction by its id", async () => {
            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([{
                ...nftTransfer.data,
                serialized: nftTransfer.serialized,
            }]);

            const response = await api.request("GET", `nft/transfers/${nftTransfer.id}`);

            expect(response.data.data.id).toStrictEqual(nftTransfer.id);
            expect(response.data.data.senderPublicKey).toStrictEqual(nftTransfer.data.senderPublicKey);
            expect(response.data.data.nftTransfer.nftIds).toStrictEqual([
                "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
            ]);
            expect(response.data.data.nftTransfer.recipientId).toStrictEqual(
                Identities.Address.fromPassphrase(secrets[1]),
            );
        });
    });
});
