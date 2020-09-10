import "@arkecosystem/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock, TransactionFactory } from "@arkecosystem/core-test-framework";
import { Identities, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import * as support from "./__support__";
import { NFTExchangeTransactionFactory } from "./__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("NFT Auction functional tests", () => {
    let collectionId;
    describe("Signed with one passphrase", () => {
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
                .createOne();

            // Transfer token
            const nftTransfer = NFTExchangeTransactionFactory.initialize(app)
                .NFTTransfer({
                    nftIds: [nftCreate.id!],
                    recipientId: Identities.Address.fromPassphrase(passphrases[2]),
                })
                .withNonce(nftAuction.nonce!.plus(1))
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
                .createOne();

            // Burn token
            const nftBurn = NFTExchangeTransactionFactory.initialize(app)
                .NFTBurn({
                    nftId: nftCreate.id!,
                })
                .withNonce(nftAuction.nonce!.plus(1))
                .withPassphrase(passphrases[0])
                .createOne();

            await expect([nftAuction, nftBurn]).not.toBeAllAccepted();
            await snoozeForBlock(1);
            await expect(nftAuction.id).toBeForged();
            await expect(nftBurn.id).not.toBeForged();
        });
    });

    describe("Signed with 2 Passphrases", () => {
        it("should broadcast, accept and forge it [Signed with 2 Passphrases] ", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 150 * 1e8)
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.initialize(app)
                .secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Create Token
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
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            // Create auction
            const nftAuction = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuction({
                    expiration: {
                        blockHeight: 33,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                    nftIds: [nftCreate.id!],
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(nftAuction).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAuction.id).toBeForged();
        });
    });

    describe("Signed with multi signature [3 of 3]", () => {
        // Register a multi signature wallet with defaults
        const passphrase = generateMnemonic();
        const secrets = [passphrase, passphrases[4], passphrases[5]];
        const participants = [
            Identities.PublicKey.fromPassphrase(secrets[0]),
            Identities.PublicKey.fromPassphrase(secrets[1]),
            Identities.PublicKey.fromPassphrase(secrets[2]),
        ];
        it("should broadcast, accept and forge it [3-of-3 multisig] ", async () => {
            // Funds to register a multi signature wallet
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Registering a multi-signature wallet
            const multiSignature = TransactionFactory.initialize(app)
                .multiSignature(participants, 3)
                .withPassphrase(passphrase)
                .withPassphraseList(secrets)
                .createOne();

            await expect(multiSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignature.id).toBeForged();

            // Send funds to multi signature wallet
            const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset!.multiSignature!);
            const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(
                multiSignature.asset!.multiSignature!,
            );

            const multiSignatureFunds = TransactionFactory.initialize(app)
                .transfer(multiSigAddress, 100 * 1e8)
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(multiSignatureFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignatureFunds.id).toBeForged();

            // Create Token
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
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(secrets)
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
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(secrets)
                .createOne();

            await expect(nftAuction).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAuction.id).toBeForged();
        });
    });
});
