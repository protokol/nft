import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";
import { Utils } from "@arkecosystem/crypto";

import * as support from "../__support__";
import { NFTExchangeTransactionFactory } from "../__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("NFT Auction Cancel functional tests - Signed with one Passphrase", () => {
    let collectionId;
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
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

        const nftAuctionCancel = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuctionCancel({
                auctionId: nftAuction.id!,
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuctionCancel).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuctionCancel.id).toBeForged();
    });

    it("should reject, because auction was already canceled", async () => {
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

        const nftAuctionCancel = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuctionCancel({
                auctionId: nftAuction.id!,
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuctionCancel).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuctionCancel.id).toBeForged();

        const nftAuctionCancelTwo = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuctionCancel({
                auctionId: nftAuction.id!,
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftAuctionCancelTwo).not.toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftAuctionCancelTwo.id).not.toBeForged();
    });

    it("should reject because auction cancel is already in pool", async () => {
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

        const nftAuctionCancel = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuctionCancel({
                auctionId: nftAuction.id!,
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        const nftAuctionCancelTwo = NFTExchangeTransactionFactory.initialize(app)
            .NFTAuctionCancel({
                auctionId: nftAuction.id!,
            })
            .withNonce(nftAuction.nonce!.plus(1))
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect([nftAuctionCancel, nftAuctionCancelTwo]).not.toBeAllAccepted();
        await snoozeForBlock(1);
        await expect(nftAuctionCancel.id).toBeForged();
        await expect(nftAuctionCancelTwo.id).not.toBeForged();
    });
});
