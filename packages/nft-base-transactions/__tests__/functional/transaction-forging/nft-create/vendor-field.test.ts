import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";

import * as support from "../__support__";
import { NFTBaseTransactionFactory } from "../__support__/transaction-factory";

let app: Contracts.Kernel.Application;

beforeAll(async () => {
    app = await support.setUp();
});

afterAll(async () => await support.tearDown());

describe("NFT Create functional tests - Signed with one Passphrase", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        // Register collection
        const nftRegisteredCollection = NFTBaseTransactionFactory.initialize(app)
            .NFTRegisterCollection({
                name: "Nascar Hero Cards",
                description: "Nascar Hero Cards collection",
                maximumSupply: 100,
                jsonSchema: {
                    type: "object",
                    additionalProperties: false,
                    required: ["ipfsHashImageFront", "issuedDate", "issuedLocation", "signed"],
                    properties: {
                        ipfsHashImageFront: {
                            type: "string",
                            maxLength: 120,
                            minLength: 1,
                        },
                        ipfsHashImageBack: {
                            type: "string",
                            maxLength: 120,
                            minLength: 1,
                        },
                        issuedDate: {
                            format: "date",
                        },
                        issuedLocation: {
                            type: "string",
                            maxLength: 255,
                            minLength: 1,
                        },
                        signed: {
                            type: "boolean",
                        },
                        tags: {
                            type: "array",
                            maxItems: 12,
                            minItems: 1,
                            additionalItems: false,
                            uniqueItems: true,
                            items: {
                                type: "string",
                            },
                        },
                    },
                },
            })
            .withVendorField("VendorField test -> [NFTRegisterCollection]")
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftRegisteredCollection).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftRegisteredCollection.id).toBeForged();

        // Create token
        const nftCreate = NFTBaseTransactionFactory.initialize(app)
            .NFTCreate({
                collectionId: nftRegisteredCollection.id!,
                attributes: {
                    ipfsHashImageFront: "QmavUFtLyRbUEEFLrmDTyRY5sLMh8UnQxWEenx2tuvzSE6",
                    ipfsHashImageBack: "QmdGCntrw9yabGJAU1nG3H38yQ2GLsphg3jwaxSGbXEj61",
                    issuedDate: "2020-09-25",
                    issuedLocation: "Mooresville , North Carolina",
                    signed: true,
                },
            })
            .withVendorField("VendorField test -> [NFTCreate]")
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(nftCreate).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nftCreate.id).toBeForged();
    });
});
