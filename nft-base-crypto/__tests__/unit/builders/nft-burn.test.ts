import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTBurnBuilder } from "../../../src/builders";
import { NFTBurnTransaction } from "../../../src/transactions";

describe("NFT Burn tests ", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTBurnTransaction);

        it("should verify correctly", () => {
            const actual = new NFTBurnBuilder()
                .NFTBurnAsset({
                    nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                })
                .vendorField("nft-burn transaction")
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new NFTBurnBuilder();
            actual.data.asset = undefined;

            const result = actual.NFTBurnAsset({
                nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
            });

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
