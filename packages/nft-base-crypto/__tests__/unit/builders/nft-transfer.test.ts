import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";

import { NFTTransferBuilder } from "../../../src/builders";
import { NFTTransferTransaction } from "../../../src/transactions";

describe("NFT Transfer tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTTransferTransaction);

        it("should verify correctly", () => {
            const actual = new NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[1]!),
                })
                .nonce("5")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            console.log(JSON.stringify(actual.build().toJson()));
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new NFTTransferBuilder();
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
