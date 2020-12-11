import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";
import { Identities } from "@arkecosystem/crypto";

import * as support from "../__support__";
import { NFTBaseTransactionFactory } from "../__support__/transaction-factory";

let app: Contracts.Kernel.Application;

beforeAll(async () => {
    app = await support.setUp();
});

afterAll(async () => await support.tearDown());

describe("NFT Burn functional tests - Signed with one Passphrase", () => {
    let registerCollectionId;
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        // Register collection
        const nftRegisteredCollection = NFTBaseTransactionFactory.initialize(app)
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

        registerCollectionId = nftRegisteredCollection.id;

        await expect(nftRegisteredCollection).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftRegisteredCollection.id).toBeForged();

        // Create token
        const nftCreate = NFTBaseTransactionFactory.initialize(app)
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

        // Burn token
        const nftBurn = NFTBaseTransactionFactory.initialize(app)
            .NFTBurn({
                nftId: nftCreate.id!,
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftBurn).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftBurn.id).toBeForged();
    });

    it("should reject, because burn for wanted nft is in pool", async () => {
        // Create token
        const nftCreate = NFTBaseTransactionFactory.initialize(app)
            .NFTCreate({
                collectionId: registerCollectionId,
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

        // Burn token
        const nftBurn = NFTBaseTransactionFactory.initialize(app)
            .NFTBurn({
                nftId: nftCreate.id!,
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        // Burn token
        const nftBurn2 = NFTBaseTransactionFactory.initialize(app)
            .NFTBurn({
                nftId: nftCreate.id!,
            })
            .withPassphrase(passphrases[0]!)
            .withNonce(nftBurn.nonce!.plus(1))
            .createOne();

        await expect([nftBurn, nftBurn2]).not.toBeAllAccepted();
        await snoozeForBlock(1);
        await expect(nftBurn.id).toBeForged();
        await expect(nftBurn2.id).not.toBeForged();
    });

    it("should reject burn because transfer is already applied", async () => {
        // Create token
        const nftCreate = NFTBaseTransactionFactory.initialize(app)
            .NFTCreate({
                collectionId: registerCollectionId,
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

        // Transfer token
        const nftTransfer = NFTBaseTransactionFactory.initialize(app)
            .NFTTransfer({
                nftIds: [nftCreate.id!],
                recipientId: Identities.Address.fromPassphrase(passphrases[2]!),
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        // Burn token
        const nftBurn = NFTBaseTransactionFactory.initialize(app)
            .NFTBurn({
                nftId: nftCreate.id!,
            })
            .withNonce(nftTransfer.nonce!.plus(1))
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect([nftTransfer, nftBurn]).not.toBeAllAccepted();
        await snoozeForBlock(1);
        await expect(nftTransfer.id).toBeForged();
        await expect(nftBurn.id).not.toBeForged();
    });
});
