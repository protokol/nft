import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTRegisterCollectionBuilder } from "../../../src/builders";
import { defaults } from "../../../src/defaults";
import { NFTRegisterCollectionTransaction } from "../../../src/transactions";

describe("NFT Register Collection tests ", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        beforeEach(() => {
            Transactions.TransactionRegistry.registerTransactionType(NFTRegisterCollectionTransaction);
        });
        afterEach(() => {
            Transactions.TransactionRegistry.deregisterTransactionType(NFTRegisterCollectionTransaction);
        });
        it("should verify correctly", () => {
            const actual = new NFTRegisterCollectionBuilder()
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

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
        it("should not verify correctly, because byte size is to big", () => {
            Transactions.TransactionRegistry.deregisterTransactionType(NFTRegisterCollectionTransaction);
            defaults.nftCollectionJsonSchemaByteSize = 1;
            Transactions.TransactionRegistry.registerTransactionType(NFTRegisterCollectionTransaction);

            const actual = new NFTRegisterCollectionBuilder()
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
            defaults.nftCollectionJsonSchemaByteSize = 100000;

            Transactions.TransactionRegistry.deregisterTransactionType(NFTRegisterCollectionTransaction);
            Transactions.TransactionRegistry.registerTransactionType(NFTRegisterCollectionTransaction);

            const actual = new NFTRegisterCollectionBuilder()
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

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new NFTRegisterCollectionBuilder();
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
