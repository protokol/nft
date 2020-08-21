import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTCreateBuilder } from "../../../src/builders";
import { defaults } from "../../../src/defaults";
import { NFTCreateTransaction } from "../../../src/transactions";

describe("NFT Create tests ", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTCreateTransaction);

        it("should verify correctly with json schema ", () => {
            const actual = new NFTCreateBuilder()
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

        it("should not verify correctly, because byte size is to big", () => {
            defaults.nftTokenAttributesByteSize = 1;
            Transactions.TransactionRegistry.deregisterTransactionType(NFTCreateTransaction);
            Transactions.TransactionRegistry.registerTransactionType(NFTCreateTransaction);

            const actual = new NFTCreateBuilder()
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
            const actual = new NFTCreateBuilder();
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
