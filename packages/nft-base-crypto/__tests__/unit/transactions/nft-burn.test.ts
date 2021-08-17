import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { Builders } from "../../../src";
import { Transactions as NFTTransactions } from "../../../src";

describe("NFT Burn tests", () => {
    Managers.configManager.setFromPreset("testnet" as any);
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTBurnTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly", () => {
            const actual = new Builders.NFTBurnBuilder()
                .NFTBurnAsset({
                    nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                })
                .nonce("3")
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual as any).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset?.nftBurn).toStrictEqual({
                nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
            });
        });

        it("should throw if asset is undefined", () => {
            const actual = new Builders.NFTBurnBuilder()
                .NFTBurnAsset({
                    nftId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
                })
                .nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
