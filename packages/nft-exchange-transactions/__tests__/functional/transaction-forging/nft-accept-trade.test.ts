import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock, TransactionFactory } from "@arkecosystem/core-test-framework";
import { Identities, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import * as support from "./__support__";
import { NFTExchangeTransactionFactory } from "./__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("NFT Accept Trade functional tests", () => {
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

            // Create bid
            const nftBid = NFTExchangeTransactionFactory.initialize(app)
                .NFTBid({
                    auctionId: nftAuction.id!,
                    bidAmount: Utils.BigNumber.make("2"),
                })
                .withPassphrase(passphrases[1])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // AcceptTrade
            const nftAcceptTrade = NFTExchangeTransactionFactory.initialize(app)
                .NFTAcceptTrade({
                    auctionId: nftAuction.id!,
                    bidId: nftBid.id!,
                })
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(nftAcceptTrade).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAcceptTrade.id).toBeForged();
        });

        it("should reject because trade was already accepted", async () => {
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
                        blockHeight: 50,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                    nftIds: [nftCreate.id!],
                })
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[1])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // AcceptTrade
            const nftAcceptTrade = NFTExchangeTransactionFactory.initialize(app)
                .NFTAcceptTrade({
                    auctionId: nftAuction.id!,
                    bidId: nftBid.id!,
                })
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(nftAcceptTrade).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAcceptTrade.id).toBeForged();

            // AcceptTrade
            const nftAcceptTradeTwo = NFTExchangeTransactionFactory.initialize(app)
                .NFTAcceptTrade({
                    auctionId: nftAuction.id!,
                    bidId: nftBid.id!,
                })
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(nftAcceptTradeTwo).not.toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAcceptTradeTwo.id).not.toBeForged();
        });

        it("should reject because accept trade is already in pool", async () => {
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
                        blockHeight: 70,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                    nftIds: [nftCreate.id!],
                })
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[1])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // AcceptTrade
            const nftAcceptTrade = NFTExchangeTransactionFactory.initialize(app)
                .NFTAcceptTrade({
                    auctionId: nftAuction.id!,
                    bidId: nftBid.id!,
                })
                .withPassphrase(passphrases[0])
                .createOne();

            // AcceptTrade
            const nftAcceptTradeTwo = NFTExchangeTransactionFactory.initialize(app)
                .NFTAcceptTrade({
                    auctionId: nftAuction.id!,
                    bidId: nftBid.id!,
                })
                .withNonce(nftAcceptTrade.nonce!.plus(1))
                .withPassphrase(passphrases[0])
                .createOne();

            await expect([nftAcceptTrade, nftAcceptTradeTwo]).not.toBeAllAccepted();
            await snoozeForBlock(1);
            await expect(nftAcceptTrade.id).toBeForged();
            await expect(nftAcceptTradeTwo.id).not.toBeForged();
        });

        it("should reject because bid was canceled", async () => {
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
                        blockHeight: 70,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                    nftIds: [nftCreate.id!],
                })
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[1])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // Cancel bid
            const nftCancelBid = NFTExchangeTransactionFactory.initialize(app)
                .NFTBidCancel({
                    bidId: nftBid.id!,
                })
                .withPassphrase(passphrases[1])
                .createOne();

            await expect(nftCancelBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCancelBid.id).toBeForged();

            // AcceptTrade
            const nftAcceptTrade = NFTExchangeTransactionFactory.initialize(app)
                .NFTAcceptTrade({
                    auctionId: nftAuction.id!,
                    bidId: nftBid.id!,
                })
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(nftAcceptTrade).not.toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAcceptTrade.id).not.toBeForged();
        });

        it("should reject because auction was canceled", async () => {
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
                        blockHeight: 70,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                    nftIds: [nftCreate.id!],
                })
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[1])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // Cancel auction
            const nftAuctionCancel = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuctionCancel({
                    auctionId: nftAuction.id!,
                })
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(nftAuctionCancel).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAuctionCancel.id).toBeForged();

            // AcceptTrade
            const nftAcceptTrade = NFTExchangeTransactionFactory.initialize(app)
                .NFTAcceptTrade({
                    auctionId: nftAuction.id!,
                    bidId: nftBid.id!,
                })
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(nftAcceptTrade).not.toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAcceptTrade.id).not.toBeForged();
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
                        blockHeight: 70,
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

            // Create bid
            const nftBid = NFTExchangeTransactionFactory.initialize(app)
                .NFTBid({
                    auctionId: nftAuction.id!,
                    bidAmount: Utils.BigNumber.make("2"),
                })
                .withPassphrase(passphrases[2])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // AcceptTrade
            const nftAcceptTrade = NFTExchangeTransactionFactory.initialize(app)
                .NFTAcceptTrade({
                    auctionId: nftAuction.id!,
                    bidId: nftBid.id!,
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(nftAcceptTrade).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAcceptTrade.id).toBeForged();
        });
    });

    describe("Signed with multi signature [3 of 3]", () => {
        // Register a multi signature wallet with defaults
        const passphrase = generateMnemonic();
        const tempPasses = [passphrase, passphrases[4], passphrases[5]];
        const participants = [
            Identities.PublicKey.fromPassphrase(tempPasses[0]),
            Identities.PublicKey.fromPassphrase(tempPasses[1]),
            Identities.PublicKey.fromPassphrase(tempPasses[2]),
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
                .withPassphraseList(tempPasses)
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
                .withPassphraseList(tempPasses)
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            // Create auction
            const nftAuction = NFTExchangeTransactionFactory.initialize(app)
                .NFTAuction({
                    expiration: {
                        blockHeight: 80,
                    },
                    startAmount: Utils.BigNumber.make("1"),
                    nftIds: [nftCreate.id!],
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(tempPasses)
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
                .withPassphrase(passphrases[2])
                .createOne();

            await expect(nftBid).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBid.id).toBeForged();

            // AcceptTrade
            const nftAcceptTrade = NFTExchangeTransactionFactory.initialize(app)
                .NFTAcceptTrade({
                    auctionId: nftAuction.id!,
                    bidId: nftBid.id!,
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(tempPasses)
                .createOne();

            await expect(nftAcceptTrade).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftAcceptTrade.id).toBeForged();
        });
    });
});
