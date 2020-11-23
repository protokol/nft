import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Interfaces, Transactions } from "@arkecosystem/crypto";
import { Builders as NFTBuilders, Enums, Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";

import {
    NFTBaseCollectionDoesNotExists,
    NFTBaseMaximumSupplyError,
    NFTBaseSchemaDoesNotMatch,
    NFTBaseSenderPublicKeyDoesNotExists,
} from "../../../src/errors";
import { NFTApplicationEvents } from "../../../src/events";
import { NFTRegisterCollectionHandler } from "../../../src/handlers";
import { INFTCollections, INFTTokens } from "../../../src/interfaces";
import { NFTIndexers } from "../../../src/wallet-indexes";
import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { collectionWalletCheck, deregisterTransactions } from "../utils/utils";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let nftCreateHandler: Handlers.TransactionHandler;

let actual: Interfaces.ITransaction;

const nftCollectionAsset: NFTInterfaces.NFTCollectionAsset = {
    name: "Nft card",
    description: "Nft card description",
    maximumSupply: 100,
    jsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
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
};

const collectionId = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";

beforeEach(async () => {
    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

    nftCreateHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTBaseTransactionTypes.NFTCreate,
            Enums.NFTBaseTransactionGroup,
        ),
        2,
    );
    wallet = buildWallet(app, passphrases[0]!);
    walletRepository.index(wallet);

    const collectionsWallet = wallet.getAttribute<INFTCollections>("nft.base.collections", {});

    collectionsWallet[collectionId] = {
        currentSupply: 0,
        nftCollectionAsset: nftCollectionAsset,
    };

    const nftRegisterHandler = (transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTBaseTransactionTypes.NFTRegisterCollection,
            Enums.NFTBaseTransactionGroup,
        ),
        2,
    ) as unknown) as NFTRegisterCollectionHandler;
    await nftRegisterHandler.compileAndPersistSchema(collectionId, nftCollectionAsset.jsonSchema);

    wallet.setAttribute("nft.base.collections", collectionsWallet);

    walletRepository.getIndex(NFTIndexers.CollectionIndexer).set(collectionId, wallet);

    actual = new NFTBuilders.NFTCreateBuilder()
        .NFTCreateToken({
            collectionId,
            attributes: {
                name: "card name",
                damage: 3,
                health: 2,
                mana: 2,
            },
        })
        .nonce("1")
        .sign(passphrases[0]!)
        .build();
});

afterEach(() => {
    deregisterTransactions();
});

describe("NFT Create tests", () => {
    describe("bootstrap tests", () => {
        it("should test with the same wallet", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });

            await expect(nftCreateHandler.bootstrap()).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTTokens>("nft.base.tokenIds")[actual.id]).toBeObject();

            collectionWalletCheck(wallet, collectionId, 1, nftCollectionAsset);

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTIndexers.NFTTokenIndexer, actual.id)).toStrictEqual(wallet);
        });

        it("should test with different wallet", async () => {
            const secondWallet = buildWallet(app, passphrases[1]!);
            walletRepository.index(secondWallet);

            const actualTwo = new NFTBuilders.NFTCreateBuilder()
                .NFTCreateToken({
                    collectionId,
                    attributes: {
                        name: "card name",
                        damage: 3,
                        health: 2,
                        mana: 2,
                    },
                })
                .nonce("1")
                .sign(passphrases[1]!)
                .build();

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actualTwo.data;
            });
            await expect(nftCreateHandler.bootstrap()).toResolve();

            collectionWalletCheck(wallet, collectionId, 1, nftCollectionAsset);

            // @ts-ignore
            expect(secondWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[actualTwo.id]).toBeObject();

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTIndexers.NFTTokenIndexer, actualTwo.id)).toStrictEqual(secondWallet);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            await expect(nftCreateHandler.throwIfCannotBeApplied(actual, wallet)).toResolve();
        });

        it("should not throw if it is allowed issuer", async () => {
            const collectionsWallet = wallet.getAttribute<INFTCollections>("nft.base.collections", {});
            collectionsWallet[collectionId] = {
                currentSupply: 0,
                nftCollectionAsset: {
                    ...nftCollectionAsset,
                    allowedIssuers: [Identities.PublicKey.fromPassphrase(passphrases[0]!)],
                },
            };
            wallet.setAttribute("nft.base.collections", collectionsWallet);

            await expect(nftCreateHandler.throwIfCannotBeApplied(actual, wallet)).toResolve();
        });

        it("should throw if nftToken is undefined", async () => {
            const undefinedTokenInTransaction = { ...actual };
            undefinedTokenInTransaction.data.asset = undefined;

            await expect(nftCreateHandler.throwIfCannotBeApplied(undefinedTokenInTransaction, wallet)).toReject();
        });

        it("should throw NFTMaximumSupplyError", async () => {
            const collectionsWallet = wallet.getAttribute<INFTCollections>("nft.base.collections", {});
            collectionsWallet[collectionId] = {
                currentSupply: 100,
                nftCollectionAsset: nftCollectionAsset,
            };
            wallet.setAttribute("nft.base.collections", collectionsWallet);

            await expect(nftCreateHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTBaseMaximumSupplyError,
            );
        });

        it("should throw NFTBaseCollectionDoesNotExists", async () => {
            const actual = new NFTBuilders.NFTCreateBuilder()
                .NFTCreateToken({
                    collectionId: "0f3bdaef56214296c191fc842adf50018f55dc6be04892dd92fb48874aabf8f5",
                    attributes: {
                        name: "card name",
                        damage: 3,
                        health: 2,
                        mana: 2,
                    },
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftCreateHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTBaseCollectionDoesNotExists,
            );
        });

        it("should throw NFTSchemaDoesNotMatch", async () => {
            const actual = new NFTBuilders.NFTCreateBuilder()
                .NFTCreateToken({
                    collectionId,
                    attributes: {
                        name: "a",
                    },
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftCreateHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTBaseSchemaDoesNotMatch,
            );
        });

        it("should throw NFTSenderPublicKeyDoesNotExists", async () => {
            const collectionsWallet = wallet.getAttribute<INFTCollections>("nft.base.collections", {});
            collectionsWallet[collectionId] = {
                currentSupply: 100,
                nftCollectionAsset: {
                    name: "Nft card",
                    description: "Nft card description",
                    maximumSupply: 100,
                    jsonSchema: {
                        properties: {
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
                    allowedIssuers: [Identities.PublicKey.fromPassphrase(passphrases[1]!)],
                },
            };
            wallet.setAttribute("nft.base.collections", collectionsWallet);

            const actual = new NFTBuilders.NFTCreateBuilder()
                .NFTCreateToken({
                    collectionId,
                    attributes: {
                        name: "card name",
                        damage: 3,
                        health: 2,
                        mana: 2,
                    },
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftCreateHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTBaseSenderPublicKeyDoesNotExists,
            );
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Container.Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftCreateHandler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTApplicationEvents.NFTCreate, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should apply correctly", async () => {
            await expect(nftCreateHandler.apply(actual)).toResolve();
            // @ts-ignore
            expect(wallet.getAttribute<INFTTokens>("nft.base.tokenIds")[actual.id]).toBeObject();

            collectionWalletCheck(wallet, collectionId, 1, nftCollectionAsset);

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTIndexers.NFTTokenIndexer, actual.id)).toStrictEqual(wallet);
        });
    });

    describe("revert tests", () => {
        it("should revert correctly", async () => {
            await nftCreateHandler.apply(actual);
            await expect(nftCreateHandler.revert(actual)).toResolve();
            // @ts-ignore
            expect(wallet.getAttribute<INFTTokens>("nft.base.tokenIds")[actual.id]).toBeUndefined();

            collectionWalletCheck(wallet, collectionId, 0, nftCollectionAsset);

            // @ts-ignore
            expect(walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).get(actual.id)).toBeUndefined();
        });

        it("should throw if nftToken is undefined", async () => {
            await nftCreateHandler.apply(actual);
            actual.data.asset = undefined;
            await expect(nftCreateHandler.revert(actual)).toReject();
        });
    });
});
