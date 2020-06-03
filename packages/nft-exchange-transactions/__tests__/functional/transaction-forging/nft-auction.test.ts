import "@arkecosystem/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock } from "@arkecosystem/core-test-framework/src/utils";
import { Utils } from "@arkecosystem/crypto";
import { NFTBaseTransactionFactory } from "@protokol/nft-base-transactions/__tests__/functional/transaction-forging/__support__/transaction-factory";

import * as support from "./__support__";
import { NFTExchangeTransactionFactory } from "./__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("NFT Auction functional tests", () => {
    describe("Signed with one passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
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

            const mftAuction = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuction({
                    expiration: {
                        blockHeight: 30,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                    nftIds: [nftCreate.id],
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(mftAuction).toBeAccepted();
            await snoozeForBlock(1);
            await expect(mftAuction.id).toBeForged();

            const nftAuctionTwo = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuction({
                    expiration: {
                        blockHeight: 32,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                    nftIds: [nftCreate.id],
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(nftAuctionTwo).not.toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAuctionTwo.id).not.toBeForged();
        });
    });
});
