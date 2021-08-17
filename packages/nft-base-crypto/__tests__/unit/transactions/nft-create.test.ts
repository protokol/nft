import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { Marvel } from "@protokol/sets";

import { NFTCreateBuilder } from "../../../src/builders";
import { NFTCreateTransaction } from "../../../src/transactions";

const asset = {
    collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
    attributes: Marvel.assets.ironMan,
};

describe("NFT Create tests", () => {
    Managers.configManager.setFromPreset("testnet" as any);
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(NFTCreateTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly", () => {
            const actual = new NFTCreateBuilder().NFTCreateToken(asset).nonce("3").sign("passphrase").getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset?.nftToken).toStrictEqual(asset);
        });

        it("should ser/deser correctly with optional recipientId", () => {
            const assetWithRecipient = { ...asset, recipientId: "AXoXnFi4z1Z6aFvjEYkDVCtBGW2PaRiM25" };
            const actual = new NFTCreateBuilder()
                .NFTCreateToken(assetWithRecipient)
                .nonce("3")
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset?.nftToken).toStrictEqual(assetWithRecipient);
        });

        it("should throw if asset is undefined", () => {
            const actual = new NFTCreateBuilder().NFTCreateToken(asset).nonce("3");

            actual.data.asset = undefined;

            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
