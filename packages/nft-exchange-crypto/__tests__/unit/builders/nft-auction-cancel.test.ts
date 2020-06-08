import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NFTAuctionCancelBuilder } from "../../../src/builders";
import { NFTAuctionCancelTransaction } from "../../../src/transactions";

describe("NFT Auction Cancel tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NFTAuctionCancelTransaction);

        it("should verify correctly ", () => {
            const actual = new NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
                })
                .nonce("5")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new NFTAuctionCancelBuilder();
            actual.data.asset = undefined;

            const result = actual.NFTAuctionCancelAsset({
                auctionId: "dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d",
            });

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
