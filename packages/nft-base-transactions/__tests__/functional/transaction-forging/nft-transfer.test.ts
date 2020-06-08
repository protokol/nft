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

describe("NFT Transfer Functional Tests", () => {
    let nftCreateId: string;

    describe("Signed with one passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
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
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            nftCreateId = nftCreate.id;

            const nftTransfer = NFTBaseTransactionFactory.initialize(app)
                .NFTTransfer({
                    nftIds: [nftCreate.id],
                    recipientId: Identities.Address.fromPassphrase(secrets[2]),
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftTransfer).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftTransfer.id).toBeForged();
        });

        it("should broadcast, accept and forge it - resend", async () => {
            const nftTransfer = NFTBaseTransactionFactory.initialize(app)
                .NFTTransfer({
                    // @ts-ignore
                    nftIds: [nftCreateId],
                    recipientId: Identities.Address.fromPassphrase(secrets[2]),
                })
                .withPassphrase(secrets[2])
                .createOne();

            await expect(nftTransfer).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftTransfer.id).toBeForged();
        });

        it("should not broadcast, accept and forge it - because wallet does't own nft", async () => {
            const nftTransfer = NFTBaseTransactionFactory.initialize(app)
                .NFTTransfer({
                    // @ts-ignore
                    nftIds: [nftCreateId],
                    recipientId: Identities.Address.fromPassphrase(secrets[2]),
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftTransfer).not.toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftTransfer.id).not.toBeForged();
        });
    });
});
