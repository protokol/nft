import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTClaimBuilder } from "../../../src/builders";
import { NFTClaimTransaction } from "../../../src/transactions";

const asset = {
    collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
};

describe("NFT Claim tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTClaimTransaction);

        it("should verify correctly with json schema", () => {
            const actual = new NFTClaimBuilder().NFTClaimToken(asset).nonce("4").sign(passphrases[0]!);

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly when Asset method is not on top", () => {
            const actual = new NFTClaimBuilder().nonce("4").NFTClaimToken(asset).sign(passphrases[0]!);

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new NFTClaimBuilder();
            actual.data.asset = undefined;

            const result = actual.NFTClaimToken(asset);

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
