import "jest-extended";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTBidBuilder } from "../../../src/builders";
import { NFTBidTransaction } from "../../../src/transactions";

describe("NFT Bid tests", () => {
    describe("Ser/deser tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTBidTransaction);

        it("should ser/deser correctly ", () => {
            const actual = new NFTBidBuilder()
                .NFTBidAsset({
                    auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("5")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            // @ts-ignore
            expect(deserialized.data.asset.nftBid).toStrictEqual({
                auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                bidAmount: Utils.BigNumber.make("1"),
            });
        });

        it("should throw if asset is undefined", () => {
            const actual = new NFTBidBuilder()
                .NFTBidAsset({
                    auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("5");

            actual.data.asset = undefined;
            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
