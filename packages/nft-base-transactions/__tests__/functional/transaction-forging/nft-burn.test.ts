import "@arkecosystem/core-test-framework/dist/matchers";

import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock, TransactionFactory } from "@arkecosystem/core-test-framework";
import { ARKCrypto } from "@protokol/nft-base-crypto";
import { generateMnemonic } from "bip39";

import * as support from "./__support__";
import { NFTBaseTransactionFactory } from "./__support__/transaction-factory";

let app: Contracts.Kernel.Application;
let networkConfig: ARKCrypto.Interfaces.NetworkConfig;

beforeAll(async () => {
    app = await support.setUp();

    // todo: remove the need for this and manual calls to withNetworkConfig on the transaction factory
    networkConfig = app.get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository).get("crypto");
});

afterAll(async () => await support.tearDown());

describe("NFT Burn functional tests", () => {
    let registerCollectionId;
    describe("Signed with one passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase] ", async () => {
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
                .withNetworkConfig(networkConfig)
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            // Burn token
            const nftBurn = NFTBaseTransactionFactory.initialize(app)
                .NFTBurn({
                    nftId: nftCreate.id!,
                })
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            // Burn token
            const nftBurn = NFTBaseTransactionFactory.initialize(app)
                .NFTBurn({
                    nftId: nftCreate.id!,
                })
                .withPassphrase(passphrases[0])
                .createOne();

            // Burn token
            const nftBurn2 = NFTBaseTransactionFactory.initialize(app)
                .NFTBurn({
                    nftId: nftCreate.id!,
                })
                .withPassphrase(passphrases[0])
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
                .withPassphrase(passphrases[0])
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            // Transfer token
            const nftTransfer = NFTBaseTransactionFactory.initialize(app)
                .NFTTransfer({
                    nftIds: [nftCreate.id!],
                    recipientId: ARKCrypto.Identities.Address.fromPassphrase(passphrases[2]),
                })
                .withPassphrase(passphrases[0])
                .createOne();

            // Burn token
            const nftBurn = NFTBaseTransactionFactory.initialize(app)
                .NFTBurn({
                    nftId: nftCreate.id!,
                })
                .withNonce(nftTransfer.nonce!.plus(1))
                .withPassphrase(passphrases[0])
                .createOne();

            await expect([nftTransfer, nftBurn]).not.toBeAllAccepted();
            await snoozeForBlock(1);
            await expect(nftTransfer.id).toBeForged();
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
                .transfer(ARKCrypto.Identities.Address.fromPassphrase(passphrase), 150 * 1e8)
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
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            // Burn token
            const nftBurn = NFTBaseTransactionFactory.initialize(app)
                .NFTBurn({
                    nftId: nftCreate.id!,
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(nftBurn).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBurn.id).toBeForged();
        });
    });

    describe("Signed with multi signature [3 of 3]", () => {
        // Register a multi signature wallet with defaults
        const passphrase = generateMnemonic();
        const secrets = [passphrase, passphrases[4], passphrases[5]];
        const participants = [
            ARKCrypto.Identities.PublicKey.fromPassphrase(secrets[0]),
            ARKCrypto.Identities.PublicKey.fromPassphrase(secrets[1]),
            ARKCrypto.Identities.PublicKey.fromPassphrase(secrets[2]),
        ];
        it("should broadcast, accept and forge it [3-of-3 multisig] ", async () => {
            // Funds to register a multi signature wallet
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(ARKCrypto.Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
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
            const multiSigAddress = ARKCrypto.Identities.Address.fromMultiSignatureAsset(
                multiSignature.asset!.multiSignature!,
            );
            const multiSigPublicKey = ARKCrypto.Identities.PublicKey.fromMultiSignatureAsset(
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
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(secrets)
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            // Burn token
            const nftBurn = NFTBaseTransactionFactory.initialize(app)
                .NFTBurn({
                    nftId: nftCreate.id!,
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(secrets)
                .createOne();

            await expect(nftBurn).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftBurn.id).toBeForged();
        });
    });
});
