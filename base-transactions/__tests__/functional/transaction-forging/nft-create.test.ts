import "@arkecosystem/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock } from "@arkecosystem/core-test-framework/src/utils";
import { Identities } from "@arkecosystem/crypto";

import * as support from "./__support__";
import { NFTBaseTransactionFactory } from "./__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("NFT Create functional tests", () => {
    describe("Signed with one passphrase", () => {
        it("should broadcast, accept and forge it - nftJsonSchema [Signed with 1 Passphrase] ", async () => {
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
                .withPassphrase(secrets[0])
                .createOne();

            await expect(nftRegisteredCollection).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftRegisteredCollection.id).toBeForged();

            const nftCreate = NFTBaseTransactionFactory.initialize(app)
                .NFTCreate({
                    // @ts-ignore
                    collectionId: nftRegisteredCollection.id,
                    attributes: {
                        name: "card name",
                        damage: 3,
                        health: 2,
                        mana: 2,
                    },
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();
        });

        it("should test maximum supply", async () => {
            const nftRegisteredSchema = NFTBaseTransactionFactory.initialize(app)
                .NFTRegisterCollection({
                    name: "Nft card",
                    description: "Nft card description",
                    maximumSupply: 3,
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
                .withPassphrase(secrets[0])
                .createOne();

            await expect(nftRegisteredSchema).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftRegisteredSchema.id).toBeForged();

            for (let i = 0; i < 3; i++) {
                const nftCreate = NFTBaseTransactionFactory.initialize(app)
                    .NFTCreate({
                        // @ts-ignore
                        collectionId: nftRegisteredSchema.id,
                        attributes: {
                            name: "card name",
                            damage: 3,
                            health: 2,
                            mana: 2,
                        },
                    })
                    .withPassphrase(secrets[0])
                    .createOne();

                await expect(nftCreate).toBeAccepted();
                await snoozeForBlock(1);
                await expect(nftCreate.id).toBeForged();
            }

            const nftCreate2 = NFTBaseTransactionFactory.initialize(app)
                .NFTCreate({
                    // @ts-ignore
                    collectionId: nftRegisteredSchema.id,
                    attributes: {
                        name: "card name",
                        damage: 3,
                        health: 2,
                        mana: 2,
                    },
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(nftCreate2).not.toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate2.id).not.toBeForged();
        });

        it("should broadcast, accept and forge it - allowedSchemaIssuers [Signed with 1 Passphrase] ", async () => {
            const nftRegisteredSchema = NFTBaseTransactionFactory.initialize(app)
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
                    allowedIssuers: [Identities.PublicKey.fromPassphrase(secrets[0])],
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(nftRegisteredSchema).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftRegisteredSchema.id).toBeForged();

            const nftCreate = NFTBaseTransactionFactory.initialize(app)
                .NFTCreate({
                    // @ts-ignore
                    collectionId: nftRegisteredSchema.id,
                    attributes: {
                        name: "card name",
                        damage: 3,
                        health: 2,
                        mana: 2,
                    },
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();
        });
    });
});
