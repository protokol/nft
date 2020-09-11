import "@arkecosystem/core-test-framework/dist/matchers";

import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock, TransactionFactory } from "@arkecosystem/core-test-framework";
import { Identities, Interfaces } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import * as support from "./__support__";
import { NFTBaseTransactionFactory } from "./__support__/transaction-factory";

let app: Contracts.Kernel.Application;
let networkConfig: Interfaces.NetworkConfig;

beforeAll(async () => {
    app = await support.setUp();

    // todo: remove the need for this and manual calls to withNetworkConfig on the transaction factory
    networkConfig = app.get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository).get("crypto");
});

afterAll(async () => await support.tearDown());

describe("NFT Register collection functional tests", () => {
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
                .withPassphrase(passphrases[0])
                .withNetworkConfig(networkConfig)
                .createOne();

            await expect(nftRegisteredCollection).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftRegisteredCollection.id).toBeForged();
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
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(nftRegisteredCollection).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftRegisteredCollection.id).toBeForged();
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
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(secrets)
                .createOne();

            await expect(nftRegisteredCollection).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftRegisteredCollection.id).toBeForged();
        });
    });
});
