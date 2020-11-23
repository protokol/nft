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

describe("NFT Transfer Functional Tests - Singed with single passphrase", () => {
    let collectionId;
    let nftCreateId: string;
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        // Register collection
        const nftRegisteredCollection = NFTBaseTransactionFactory.initialize(app)
            .NFTRegisterCollection({
                name: "Nft card",
                description: "Nft card description",
                maximumSupply: 100,
                jsonSchema: {
                    properties: {
                        additionalProperties: false,
                        name: {
                            type: "string",
                            minLength: 3,
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
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftCreate).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCreate.id).toBeForged();

        nftCreateId = nftCreate.id!;

        // Transfer token
        const nftTransfer = NFTBaseTransactionFactory.initialize(app)
            .NFTTransfer({
                nftIds: [nftCreate.id!],
                recipientId: Identities.Address.fromPassphrase(passphrases[2]!),
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftTransfer).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftTransfer.id).toBeForged();
    });

    it("should broadcast, accept and forge it - resend", async () => {
        // Transfer token
        const nftTransfer = NFTBaseTransactionFactory.initialize(app)
            .NFTTransfer({
                nftIds: [nftCreateId],
                recipientId: Identities.Address.fromPassphrase(passphrases[2]!),
            })
            .withPassphrase(passphrases[2]!)
            .createOne();

        await expect(nftTransfer).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftTransfer.id).toBeForged();
    });

    it("should not broadcast, accept and forge it - because wallet does't own nft", async () => {
        // Transfer token
        const nftTransfer = NFTBaseTransactionFactory.initialize(app)
            .NFTTransfer({
                nftIds: [nftCreateId],
                recipientId: Identities.Address.fromPassphrase(passphrases[2]!),
            })
            .withPassphrase(passphrases[1]!)
            .createOne();

        await expect(nftTransfer).not.toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftTransfer.id).not.toBeForged();
    });

    it("should reject nftTransfer, because transfer for wanted nft is already in pool", async () => {
        // Transfer token
        const nftTransfer = NFTBaseTransactionFactory.initialize(app)
            .NFTTransfer({
                nftIds: [nftCreateId],
                recipientId: Identities.Address.fromPassphrase(passphrases[2]!),
            })
            .withPassphrase(passphrases[2]!)
            .createOne();

        // Transfer token
        const nftTransfer2 = NFTBaseTransactionFactory.initialize(app)
            .NFTTransfer({
                nftIds: [nftCreateId],
                recipientId: Identities.Address.fromPassphrase(passphrases[2]!),
            })
            // @ts-ignore
            .withNonce(nftTransfer.nonce.plus(1))
            .withPassphrase(passphrases[2]!)
            .createOne();

        await expect([nftTransfer, nftTransfer2]).not.toBeAllAccepted();
        await snoozeForBlock(1);
        await expect(nftTransfer.id).toBeForged();
        await expect(nftTransfer2.id).not.toBeForged();
    });

    it("should reject transfer because burn is already applied", async () => {
        // Create token
        const nftCreate = NFTBaseTransactionFactory.initialize(app)
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

        // Burn token
        const nftBurn = NFTBaseTransactionFactory.initialize(app)
            .NFTBurn({
                nftId: nftCreate.id!,
            })
            .withPassphrase(passphrases[0]!)
            .createOne();

        // Transfer token
        const nftTransfer = NFTBaseTransactionFactory.initialize(app)
            .NFTTransfer({
                nftIds: [nftCreate.id!],
                recipientId: Identities.Address.fromPassphrase(passphrases[2]!),
            })
            .withNonce(nftBurn.nonce!.plus(1))
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect([nftBurn, nftTransfer]).not.toBeAllAccepted();
        await snoozeForBlock(1);
        await expect(nftBurn.id).toBeForged();
        await expect(nftTransfer.id).not.toBeForged();
    });
});
