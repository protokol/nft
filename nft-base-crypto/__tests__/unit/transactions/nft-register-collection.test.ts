import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTRegisterCollectionBuilder } from "../../../src/builders";
import { NFTRegisterCollectionTransaction } from "../../../src/transactions";

describe("NFT register collection tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(NFTRegisterCollectionTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly with nftJsonSchema", () => {
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
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            // @ts-ignore
            expect(deserialized.data.asset.nftCollection).toStrictEqual({
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
        });

        it("should throw if asset is undefined", () => {
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
                .nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
