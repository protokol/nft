import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTBurnBuilder } from "../../../src/builders";
import { NFTBurnTransaction } from "../../../src/transactions";

describe("NFT Burn tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(NFTBurnTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly", () => {
            const actual = new NFTBurnBuilder()
                .NFTBurnAsset({
                    nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                })
                .nonce("3")
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            // @ts-ignore
            expect(deserialized.data.asset.nftBurn).toStrictEqual({
                nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
            });
        });

        it("should throw if asset is undefined", () => {
            const actual = new NFTBurnBuilder()
                .NFTBurnAsset({
                    nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                })
                .nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
