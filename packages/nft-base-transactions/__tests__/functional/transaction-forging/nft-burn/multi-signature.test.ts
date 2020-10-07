import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock, TransactionFactory } from "@arkecosystem/core-test-framework";
import { ARKCrypto } from "@protokol/nft-base-crypto";
import { generateMnemonic } from "bip39";

import * as support from "../__support__";
import { NFTBaseTransactionFactory } from "../__support__/transaction-factory";

let app: Contracts.Kernel.Application;

beforeAll(async () => {
    app = await support.setUp();
});

afterAll(async () => await support.tearDown());

describe("NFT Burn functional tests - Signed with multi signature", () => {
    // Register a multi signature wallet with defaults
    const passphrase = generateMnemonic();
    const secrets = [passphrase, passphrases[4], passphrases[5]];
    const participants = [
        ARKCrypto.Identities.PublicKey.fromPassphrase(secrets[0]),
        ARKCrypto.Identities.PublicKey.fromPassphrase(secrets[1]),
        ARKCrypto.Identities.PublicKey.fromPassphrase(secrets[2]),
    ];
    it("should broadcast, accept and forge it [3-of-3 multisig] ", async () => {
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
            .withPassphrase(passphrases[0])
            .createOne();

        await expect(nftRegisteredCollection).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftRegisteredCollection.id).toBeForged();

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
                collectionId: nftRegisteredCollection.id!,
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
