import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";
import { Identities, Utils } from "@arkecosystem/crypto";

import * as support from "../__support__";
import { NFTExchangeTransactionFactory } from "../__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("NFT Auction functional tests - Signed with one Passphrase", () => {
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
                    blockHeight: 30,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuction.id).toBeForged();
    });

    it("should not accept second auction", async () => {
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
                    blockHeight: 30,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuction.id).toBeForged();

        // Create auction
        const nftAuctionTwo = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuction({
                expiration: {
                    blockHeight: 32,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuctionTwo).not.toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuctionTwo.id).not.toBeForged();
    });

    it("should reject second auction because auction for nft is in pool", async () => {
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
                    blockHeight: 30,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        // Create auction
        const nftAuctionTwo = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuction({
                expiration: {
                    blockHeight: 32,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withNonce(nftAuction.nonce!.plus(1))
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect([nftAuction, nftAuctionTwo]).not.toBeAllAccepted();
        await snoozeForBlock(1);
        await expect(nftAuction.id).toBeForged();
        await expect(nftAuctionTwo.id).not.toBeForged();
    });

    it("should reject nft transfer because nft is on auction", async () => {
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
                    blockHeight: 30,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        // Transfer token
        const nftTransfer = NFTExchangeTransactionFactory.initialize(app)
            .NFTTransfer({
                nftIds: [nftCreate.id!],
                recipientId: Identities.Address.fromPassphrase(passphrases[2]!),
            })
            .withNonce(nftAuction.nonce!.plus(1))
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect([nftAuction, nftTransfer]).not.toBeAllAccepted();
        await snoozeForBlock(1);
        await expect(nftAuction.id).toBeForged();
        await expect(nftTransfer.id).not.toBeForged();
    });

    it("should reject nft burn because nft is on auction", async () => {
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
                    blockHeight: 30,
                },
                startAmount: Utils.BigNumber.make("1"),
                nftIds: [nftCreate.id!],
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        // Burn token
        const nftBurn = NFTExchangeTransactionFactory.initialize(app)
            .NFTBurn({
                nftId: nftCreate.id!,
            })
            .withNonce(nftAuction.nonce!.plus(1))
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect([nftAuction, nftBurn]).not.toBeAllAccepted();
        await snoozeForBlock(1);
        await expect(nftAuction.id).toBeForged();
        await expect(nftBurn.id).not.toBeForged();
    });
});
