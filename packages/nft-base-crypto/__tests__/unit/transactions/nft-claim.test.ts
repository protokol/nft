import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTClaimBuilder } from "../../../src/builders";
import { NFTClaimTransaction } from "../../../src/transactions";

const asset = {
    collectionId: "5fe521beb05636fbe16d2eb628d835e6eb635070de98c3980c9ea9ea4496061a",
};

describe("NFT Claim tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(NFTClaimTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly", () => {
            const actual = new NFTClaimBuilder().NFTClaimToken(asset).nonce("3").sign("passphrase").getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.nftClaim).toStrictEqual(asset);
        });

        it("should throw if asset is undefined", () => {
            const actual = new NFTClaimBuilder().NFTClaimToken(asset).nonce("3");

            actual.data.asset = undefined;

            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
