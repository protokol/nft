import "@arkecosystem/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@arkecosystem/core-test-framework/src/utils";
import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import * as support from "./__support__";
import { NFTBaseTransactionFactory } from "./__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("NFT Transfer Functional Tests", () => {
    let collectionId;
    let nftCreateId: string;
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
                .withPassphrase(secrets[0])
                .createOne();

            collectionId = nftRegisteredCollection.id;

            await expect(nftRegisteredCollection).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftRegisteredCollection.id).toBeForged();

            // Create token
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

            // Transfer token
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
            // Transfer token
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
            // Transfer token
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

        it("should reject nftTransfer, because transfer for wanted nft is already in pool", async () => {
            // Transfer token
            const nftTransfer = NFTBaseTransactionFactory.initialize(app)
                .NFTTransfer({
                    // @ts-ignore
                    nftIds: [nftCreateId],
                    recipientId: Identities.Address.fromPassphrase(secrets[2]),
                })
                .withPassphrase(secrets[2])
                .createOne();
            // Transfer token
            const nftTransfer2 = NFTBaseTransactionFactory.initialize(app)
                .NFTTransfer({
                    // @ts-ignore
                    nftIds: [nftCreateId],
                    recipientId: Identities.Address.fromPassphrase(secrets[2]),
                })
                // @ts-ignore
                .withNonce(nftTransfer.nonce.plus(1))
                .withPassphrase(secrets[2])
                .createOne();

            await expect([nftTransfer, nftTransfer2]).not.toBeAllAccepted();
            await snoozeForBlock(1);
            await expect(nftTransfer.id).toBeForged();
            await expect(nftTransfer2.id).not.toBeForged();
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
                    // @ts-ignore
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

            // Transfer
            const nftTransfer = NFTBaseTransactionFactory.initialize(app)
                .NFTTransfer({
                    // @ts-ignore
                    nftIds: [nftCreate.id],
                    recipientId: Identities.Address.fromPassphrase(secrets[2]),
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(nftTransfer).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftTransfer.id).toBeForged();
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
            // @ts-ignore
            const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset.multiSignature);
            // @ts-ignore
            const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature.asset.multiSignature);

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
                    // @ts-ignore
                    collectionId: collectionId,
                    attributes: {
                        name: "card name",
                        damage: 3,
                        health: 2,
                        mana: 2,
                    },
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(nftCreate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftCreate.id).toBeForged();

            // Transfer
            const nftTransfer = NFTBaseTransactionFactory.initialize(app)
                .NFTTransfer({
                    // @ts-ignore
                    nftIds: [nftCreate.id],
                    recipientId: Identities.Address.fromPassphrase(secrets[2]),
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(nftTransfer).toBeAccepted();
            await snoozeForBlock(1);
            await expect(nftTransfer.id).toBeForged();
        });
    });
});
