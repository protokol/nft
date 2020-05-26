import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTTransferBuilder } from "../../../src/builders";
import { NFTTransferTransaction } from "../../../src/transactions";

describe("Transfer NFTs test ", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(NFTTransferTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly", () => {
            const actual = new NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: "AXoXnFi4z1Z6aFvjEYkDVCtBGW2PaRiM25",
                })
                .version(2)
                .nonce("3")
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            // @ts-ignore
            expect(deserialized.data.asset.nftTransfer).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                recipientId: "AXoXnFi4z1Z6aFvjEYkDVCtBGW2PaRiM25",
            });
        });

        it("should throw if asset is undefined", () => {
            const actual = new NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: "AXoXnFi4z1Z6aFvjEYkDVCtBGW2PaRiM25",
                })
                .version(2)
                .nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
