import "jest-extended";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTBidBuilder } from "../../../src/builders";
import { NFTBidTransaction } from "../../../src/transactions";

describe("NFT Bid tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTBidTransaction);

        it("should verify correctly ", () => {
            const actual = new NFTBidBuilder()
                .NFTBidAsset({
                    auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("5")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new NFTBidBuilder();
            actual.data.asset = undefined;

            const result = actual.NFTBidAsset({
                auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                bidAmount: Utils.BigNumber.make("1"),
            });

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
