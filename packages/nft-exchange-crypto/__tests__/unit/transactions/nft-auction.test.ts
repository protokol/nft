import { Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTAuctionBuilder } from "../../../src/builders";
import { NFTAuctionTransaction } from "../../../src/transactions";

describe("NFT Auction tests", () => {
    describe("Ser/deser tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTAuctionTransaction);

        it("should ser/deser correctly ", () => {
            const actual = new NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("5")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            // @ts-ignore
            expect(deserialized.data.asset.nftAuction).toStrictEqual({
                nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                startAmount: Utils.BigNumber.make("1"),
                expiration: {
                    blockHeight: 1,
                },
            });
        });

        it("should throw if asset is undefined", () => {
            const actual = new NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("5");

            actual.data.asset = undefined;
            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
