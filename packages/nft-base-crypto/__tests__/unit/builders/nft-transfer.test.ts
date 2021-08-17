import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";

import { Builders } from "../../../src";
import { Transactions as NFTTransactions } from "../../../src";

describe("NFT Transfer tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet" as any);
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTTransferTransaction);

        it("should verify correctly", () => {
            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[1]!),
                })
                .nonce("5")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly when Asset method is not on top", () => {
            const actual = new Builders.NFTTransferBuilder()
                .nonce("5")
                .NFTTransferAsset({
                    nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[1]!),
                })
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new Builders.NFTTransferBuilder();
            actual.data.asset = undefined;

            const result = actual.NFTTransferAsset({
                nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                recipientId: Identities.Address.fromPassphrase(passphrases[1]!),
            });

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
