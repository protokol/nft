import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { Builders } from "../../../src";
import { Defaults } from "../../../src";
import { Transactions as NFTTransactions } from "../../../src";

describe("NFT Register Collection tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet" as any);
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTRegisterCollectionTransaction);

        it("should verify correctly", () => {
            const actual = new Builders.NFTRegisterCollectionBuilder()
                .NFTRegisterCollectionAsset({
                    name: "Heartstone card",
                    description: "A card from heartstone game",
                    maximumSupply: 100,
                    jsonSchema: {
                        properties: {
                            number: {
                                type: "number",
                            },
                            string: { type: "string" },
                        },
                    },
                })
                .nonce("3")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTruthy();
            expect(actual.verify()).toBeTruthy();
        });

        it("should verify correctly when Asset method is not on top", () => {
            const actual = new Builders.NFTRegisterCollectionBuilder()
                .nonce("3")
                .NFTRegisterCollectionAsset({
                    name: "Heartstone card",
                    description: "A card from heartstone game",
                    maximumSupply: 100,
                    jsonSchema: {
                        properties: {
                            number: {
                                type: "number",
                            },
                            string: { type: "string" },
                        },
                    },
                })
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTruthy();
            expect(actual.verify()).toBeTruthy();
        });

        it("should not verify correctly, because byte size is to big", () => {
            Transactions.TransactionRegistry.deregisterTransactionType(
                NFTTransactions.NFTRegisterCollectionTransaction,
            );
            Defaults.defaults.nftCollectionJsonSchemaByteSize = 1;
            Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTRegisterCollectionTransaction);

            const actual = new Builders.NFTRegisterCollectionBuilder()
                .NFTRegisterCollectionAsset({
                    name: "Heartstone card",
                    description: "A card from heartstone game",
                    maximumSupply: 100,
                    jsonSchema: {
                        properties: {
                            number: {
                                type: "number",
                            },
                            string: { type: "string" },
                        },
                    },
                })
                .nonce("3")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(() => {
                actual.build();
            }).toThrowError();
        });

        it("should verify correctly with allowedSchemaIssuers", () => {
            Transactions.TransactionRegistry.deregisterTransactionType(
                NFTTransactions.NFTRegisterCollectionTransaction,
            );
            Defaults.defaults.nftCollectionJsonSchemaByteSize = 100000;
            Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTRegisterCollectionTransaction);

            const actual = new Builders.NFTRegisterCollectionBuilder()
                .NFTRegisterCollectionAsset({
                    name: "Heartstone card",
                    description: "A card from heartstone game",
                    maximumSupply: 100,
                    jsonSchema: {
                        properties: {
                            number: {
                                type: "number",
                            },
                            string: { type: "string" },
                        },
                    },
                    allowedIssuers: [
                        "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                        "030c8ee7a2026ac23dbcb650e08cda9fc6386805fa2d788e6a72ba01d72fdcc75e",
                    ],
                })
                .nonce("3")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTruthy();
            expect(actual.verify()).toBeTruthy();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new Builders.NFTRegisterCollectionBuilder();
            actual.data.asset = undefined;

            const result = actual.NFTRegisterCollectionAsset({
                name: "Heartstone card",
                description: "A card from heartstone game",
                maximumSupply: 100,
                jsonSchema: {
                    properties: {
                        number: {
                            type: "number",
                        },
                        string: { type: "string" },
                    },
                },
            });

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
