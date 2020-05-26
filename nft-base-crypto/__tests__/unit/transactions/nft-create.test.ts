import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTCreateBuilder } from "../../../src/builders";
import { NFTCreateTransaction } from "../../../src/transactions";

describe("NFT Create tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(NFTCreateTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly", () => {
            const actual = new NFTCreateBuilder()
                .NFTCreateToken({
                    collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                    attributes: {
                        number: 5,
                        string: "something",
                    },
                })
                .nonce("3")
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            // @ts-ignore
            expect(deserialized.data.asset.nftToken).toStrictEqual({
                collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                attributes: {
                    number: 5,
                    string: "something",
                },
            });
        });

        it("should throw if asset is undefined", () => {
            const actual = new NFTCreateBuilder()
                .NFTCreateToken({
                    collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                    attributes: {
                        number: 5,
                        string: "something",
                    },
                })
                .nonce("3");

            actual.data.asset = undefined;

            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
