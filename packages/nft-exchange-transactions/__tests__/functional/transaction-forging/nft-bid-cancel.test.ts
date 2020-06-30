import "@arkecosystem/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@arkecosystem/core-test-framework/src/utils";
import { Identities, Utils } from "@arkecosystem/crypto";
import { NFTBaseTransactionFactory } from "@protokol/nft-base-transactions/__tests__/functional/transaction-forging/__support__/transaction-factory";
import { generateMnemonic } from "bip39";

import * as support from "./__support__";
import { NFTExchangeTransactionFactory } from "./__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("NFT Bid Cancel functional tests", () => {
    let collectionId;
    describe("Signed with one passphrase", () => {
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // Cancel bid
            const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
                .NFTBidCancel({
                    bidId: nftBid.id!,
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftCancelBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCancelBid.id).toBeForged();
        });

        it("should reject because wallet already canceled bid", async () => {
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // Cancel bid
            const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
                .NFTBidCancel({
                    bidId: nftBid.id!,
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftCancelBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCancelBid.id).toBeForged();

            // Cancel bid
            const nftCancelBidTwo = NFTExchangeTransactionFactory.initialize(app)
                .NFTBidCancel({
                    bidId: nftBid.id!,
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftCancelBidTwo).not.toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCancelBidTwo.id).not.toBeForged();
        });

        it("should reject because cancel bid is already in pool", async () => {
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // Cancel bid
            const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
                .NFTBidCancel({
                    bidId: nftBid.id!,
                })
                .withPassphrase(secrets[1])
                .createOne();

            // Cancel bid
            const nftCancelBidTwo = NFTExchangeTransactionFactory.initialize(app)
                .NFTBidCancel({
                    bidId: nftBid.id!,
                })
                .withNonce(nftCancelBid.nonce!.plus(1))
                .withPassphrase(secrets[1])
                .createOne();

            await expect([nftCancelBid, nftCancelBidTwo]).not.toBeAllAccepted();
            await snoozeForBlock(1);
            await expect(nftCancelBid.id).toBeForged();
            await expect(nftCancelBidTwo.id).not.toBeForged();
        });

        it("should reject bid because wallet canceled auction", async () => {
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // Cancel auction
            const nftAuctionCancel = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuctionCancel({
                    auctionId: nftAuction.id!,
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(nftAuctionCancel).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAuctionCancel.id).toBeForged();

            // Cancel bid
            const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
                .NFTBidCancel({
                    bidId: nftBid.id!,
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftCancelBid).not.toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCancelBid.id).not.toBeForged();
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
                .withPassphrase(secrets[0])
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
                .withPassphrase(secrets[1])
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
                .withPassphrase(secrets[1])
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
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // Cancel bid
            const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
                .NFTBidCancel({
                    bidId: nftBid.id!,
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(nftCancelBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCancelBid.id).toBeForged();
        });
    });

    describe("Signed with multi signature [3 of 3]", () => {
        // Register a multi signature wallet with defaults
        const passphrase = generateMnemonic();
        const passphrases = [passphrase, secrets[4], secrets[5]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];
        it("should broadcast, accept and forge it [3-of-3 multisig] ", async () => {
            // Funds to register a multi signature wallet
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Registering a multi-signature wallet
            const multiSignature = TransactionFactory.initialize(app)
                .multiSignature(participants, 3)
                .withPassphrase(passphrase)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(multiSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignature.id).toBeForged();

            // Send funds to multi signature wallet
            const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset!.multiSignature!);
            const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature.asset!.multiSignature!);

            const multiSignatureFunds = TransactionFactory.initialize(app)
                .transfer(multiSigAddress, 100 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(multiSignatureFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignatureFunds.id).toBeForged();

            // Create Token
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
                .withPassphrase(secrets[1])
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            // Create auction
            const nftAuction = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuction({
                    expiration: {
                        blockHeight: 70,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                    nftIds: [nftCreate.id!],
                })
                .withPassphrase(secrets[1])
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
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // Cancel bid
            const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
                .NFTBidCancel({
                    // @ts-ignore
                    bidId: nftBid.id,
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(nftCancelBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCancelBid.id).toBeForged();
        });
    });
});
