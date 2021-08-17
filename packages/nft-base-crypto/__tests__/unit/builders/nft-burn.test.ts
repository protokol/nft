import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { Builders } from "../../../src";
import { Transactions as NFTTransactions } from "../../../src";

describe("NFT Burn tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet" as any);
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTBurnTransaction);

        it("should verify correctly", () => {
            const actual = new Builders.NFTBurnBuilder()
                .NFTBurnAsset({
                    nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                })
                .vendorField("nft-burn transaction")
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly when Asset method is not on top", () => {
            const actual = new Builders.NFTBurnBuilder()
                .vendorField("nft-burn transaction")
                .nonce("4")
                .NFTBurnAsset({
                    nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                })
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new Builders.NFTBurnBuilder();
            actual.data.asset = undefined;

            const result = actual.NFTBurnAsset({
                nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
            });

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
