import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";
import { Utils } from "@arkecosystem/crypto";

import * as support from "../__support__";
import { NFTExchangeTransactionFactory } from "../__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("NFT Bid Cancel functional tests - Signed with one passphrase", () => {
    let collectionId;
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        // Register collection
        const nftRegisteredCollection = NFTExchangeTransactionFactory.initialize(app)
            .NFTRegisterCollection({
                name: "Nft card",
                description: "Nft card description",
                maximumSupply: 100,
                jsonSchema: {
                    properties: {
                        name: {
                            type: "string",
                        },
                        damage: {
                            type: "integer",
                        },
                        health: {
                            type: "integer",
                        },
                        mana: {
                            type: "integer",
                        },
                    },
                },
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        collectionId = nftRegisteredCollection.id;

        await expect(nftRegisteredCollection).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftRegisteredCollection.id).toBeForged();

        // Create token
        const nftCreate = NFTExchangeTransactionFactory.initialize(app)
            .NFTCreate({
                collectionId: nftRegisteredCollection.id!,
                attributes: {
                    name: "card name",
                    damage: 3,
                    health: 2,
                    mana: 2,
                },
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftCreate).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCreate.id).toBeForged();

        // Create auction
        const nftAuction = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuction({
                expiration: {
                    blockHeight: 27,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuction.id).toBeForged();

        // Create bid
        const nftBid = NFTExchangeTransactionFactory.initialize(app)
            .NFTBid({
                auctionId: nftAuction.id!,
                bidAmount: Utils.BigNumber.make("2"),
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftBid).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftBid.id).toBeForged();

        // Cancel bid
        const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
            .NFTBidCancel({
                bidId: nftBid.id!,
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftCancelBid).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCancelBid.id).toBeForged();
    });

    it("should reject because wallet already canceled bid", async () => {
        // Create token
        const nftCreate = NFTExchangeTransactionFactory.initialize(app)
            .NFTCreate({
                collectionId: collectionId,
                attributes: {
                    name: "card name",
                    damage: 3,
                    health: 2,
                    mana: 2,
                },
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftCreate).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCreate.id).toBeForged();

        // Create auction
        const nftAuction = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuction({
                expiration: {
                    blockHeight: 50,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuction.id).toBeForged();

        // Create bid
        const nftBid = NFTExchangeTransactionFactory.initialize(app)
            .NFTBid({
                auctionId: nftAuction.id!,
                bidAmount: Utils.BigNumber.make("2"),
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftBid).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftBid.id).toBeForged();

        // Cancel bid
        const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
            .NFTBidCancel({
                bidId: nftBid.id!,
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftCancelBid).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCancelBid.id).toBeForged();

        // Cancel bid
        const nftCancelBidTwo = NFTExchangeTransactionFactory.initialize(app)
            .NFTBidCancel({
                bidId: nftBid.id!,
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftCancelBidTwo).not.toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCancelBidTwo.id).not.toBeForged();
    });

    it("should reject because cancel bid is already in pool", async () => {
        // Create token
        const nftCreate = NFTExchangeTransactionFactory.initialize(app)
            .NFTCreate({
                collectionId: collectionId,
                attributes: {
                    name: "card name",
                    damage: 3,
                    health: 2,
                    mana: 2,
                },
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftCreate).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCreate.id).toBeForged();

        // Create auction
        const nftAuction = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuction({
                expiration: {
                    blockHeight: 50,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuction.id).toBeForged();

        // Create bid
        const nftBid = NFTExchangeTransactionFactory.initialize(app)
            .NFTBid({
                auctionId: nftAuction.id!,
                bidAmount: Utils.BigNumber.make("2"),
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftBid).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftBid.id).toBeForged();

        // Cancel bid
        const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
            .NFTBidCancel({
                bidId: nftBid.id!,
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        // Cancel bid
        const nftCancelBidTwo = NFTExchangeTransactionFactory.initialize(app)
            .NFTBidCancel({
                bidId: nftBid.id!,
            })
            .withNonce(nftCancelBid.nonce!.plus(1))
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect([nftCancelBid, nftCancelBidTwo]).not.toBeAllAccepted();
        await snoozeForBlock(1);
        await expect(nftCancelBid.id).toBeForged();
        await expect(nftCancelBidTwo.id).not.toBeForged();
    });

    it("should reject bid because wallet canceled auction", async () => {
        // Create token
        const nftCreate = NFTExchangeTransactionFactory.initialize(app)
            .NFTCreate({
                collectionId: collectionId,
                attributes: {
                    name: "card name",
                    damage: 3,
                    health: 2,
                    mana: 2,
                },
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftCreate).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCreate.id).toBeForged();

        // Create auction
        const nftAuction = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuction({
                expiration: {
                    blockHeight: 50,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuction.id).toBeForged();

        // Create bid
        const nftBid = NFTExchangeTransactionFactory.initialize(app)
            .NFTBid({
                auctionId: nftAuction.id!,
                bidAmount: Utils.BigNumber.make("2"),
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftBid).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftBid.id).toBeForged();

        // Cancel auction
        const nftAuctionCancel = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuctionCancel({
                auctionId: nftAuction.id!,
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuctionCancel).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuctionCancel.id).toBeForged();

        // Cancel bid
        const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
            .NFTBidCancel({
                bidId: nftBid.id!,
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftCancelBid).not.toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCancelBid.id).not.toBeForged();
    });
});
