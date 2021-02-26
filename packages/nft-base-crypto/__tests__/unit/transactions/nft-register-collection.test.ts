import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTRegisterCollectionBuilder } from "../../../src/builders";
import { NFTRegisterCollectionTransaction } from "../../../src/transactions";

const collection = {
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
};

describe("NFT register collection tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(NFTRegisterCollectionTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly with nftJsonSchema", () => {
            const actual = new NFTRegisterCollectionBuilder()
                .NFTRegisterCollectionAsset(collection)
                .nonce("3")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.nftCollection).toStrictEqual(collection);
        });

        it("should ser/deser correctly with metadata", () => {
            const collectionWithMetadata = {
                ...collection,
                metadata: {
                    number: 100,
                    string: "Card",
                },
            };
            const actual = new NFTRegisterCollectionBuilder()
                .NFTRegisterCollectionAsset(collectionWithMetadata)
                .nonce("3")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.nftCollection).toStrictEqual(collectionWithMetadata);
        });

        it("should throw if asset is undefined", () => {
            const actual = new NFTRegisterCollectionBuilder().NFTRegisterCollectionAsset(collection).nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
