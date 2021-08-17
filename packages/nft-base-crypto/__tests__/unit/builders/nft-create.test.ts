import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { Builders } from "../../../src";
import { Defaults } from "../../../src";
import { Transactions as NFTTransactions } from "../../../src";

describe("NFT Create tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet" as any);
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTCreateTransaction);

        it("should verify correctly with json schema", () => {
            const actual = new Builders.NFTCreateBuilder()
                .NFTCreateToken({
                    collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                    attributes: {
                        number: 5,
                        string: "something",
                    },
                })
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly when Asset method is not on top", () => {
            const actual = new Builders.NFTCreateBuilder()
                .nonce("4")
                .NFTCreateToken({
                    collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                    attributes: {
                        number: 5,
                        string: "something",
                    },
                })
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should not verify correctly, because byte size is to big", () => {
            Defaults.defaults.nftTokenAttributesByteSize = 1;
            Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTCreateTransaction);
            Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTCreateTransaction);

            const actual = new Builders.NFTCreateBuilder()
                .NFTCreateToken({
                    collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                    attributes: {
                        string: "something",
                    },
                })
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(() => {
                actual.build();
            }).toThrowError();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new Builders.NFTCreateBuilder();
            actual.data.asset = undefined;

            const result = actual.NFTCreateToken({
                collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                attributes: {
                    number: 5,
                    string: "something",
                },
            });

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
