import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Enums, Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";

import { FeeType } from "../../../src/enums";
import {
    NFTBaseInvalidAjvSchemaError,
    NFTBaseUnauthorizedCollectionRegistrator,
    StaticFeeMismatchError,
} from "../../../src/errors";
import { NFTApplicationEvents } from "../../../src/events";
import { NFTIndexers } from "../../../src/wallet-indexes";
import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { collectionWalletCheck, deregisterTransactions } from "../utils/utils";

let app: Application;

let senderWallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let handler: Handlers.TransactionHandler;

let actual: Interfaces.ITransaction;

const nftCollectionAsset: NFTInterfaces.NFTCollectionAsset = {
    name: "Nft card",
    description: "Nft description",
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
};

beforeEach(() => {
    app = initApp();

    senderWallet = buildWallet(app, passphrases[0]!);

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

    handler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTBaseTransactionTypes.NFTRegisterCollection,
            Enums.NFTBaseTransactionGroup,
        ),
        2,
    );
    walletRepository.index(senderWallet);

    actual = new Builders.NFTRegisterCollectionBuilder()
        .NFTRegisterCollectionAsset(nftCollectionAsset)
        .nonce("1")
        .sign(passphrases[0]!)
        .build();
});

afterEach(() => {
    deregisterTransactions();
});

describe("NFT Register collection tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });

            await expect(handler.bootstrap()).toResolve();

            // @ts-ignore
            collectionWalletCheck(senderWallet, actual.id, 0, nftCollectionAsset);

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTIndexers.CollectionIndexer, actual.id)).toStrictEqual(senderWallet);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if nftToken is undefined", async () => {
            const undefinedTokenInTransaction = { ...actual };
            undefinedTokenInTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(undefinedTokenInTransaction, senderWallet)).toReject();
        });

        it("should throw NFTBaseInvalidAjvSchemaError", async () => {
            const actual = new Builders.NFTRegisterCollectionBuilder()
                .NFTRegisterCollectionAsset({
                    name: "Nft card",
                    description: "Nft description",
                    maximumSupply: 100,
                    jsonSchema: {
                        properties: {
                            string: { type: "something" },
                        },
                    },
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                NFTBaseInvalidAjvSchemaError,
            );
        });

        it("should allow everyone to register a collection", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "authorizedRegistrators",
                [],
            );

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should allow to register a collection for authorized registrators only", async () => {
            app.get<Providers.PluginConfiguration>(
                Container.Identifiers.PluginConfiguration,
            ).set("authorizedRegistrators", [senderWallet.publicKey]);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should prevent to register a collection for unauthorized registrators", async () => {
            app.get<Providers.PluginConfiguration>(
                Container.Identifiers.PluginConfiguration,
            ).set("authorizedRegistrators", ["authorizedPublicKey"]);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                NFTBaseUnauthorizedCollectionRegistrator,
            );
        });

        it("should throw StaticFeeMismatchError", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );

            actual = new Builders.NFTRegisterCollectionBuilder()
                .NFTRegisterCollectionAsset(nftCollectionAsset)
                .nonce("1")
                .fee("1")
                .sign(passphrases[0]!)
                .build();

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                StaticFeeMismatchError,
            );
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Container.Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTApplicationEvents.NFTRegisterCollection, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should test apply method", async () => {
            await expect(handler.apply(actual)).toResolve();

            // @ts-ignore
            collectionWalletCheck(senderWallet, actual.id, 0, nftCollectionAsset);

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTIndexers.CollectionIndexer, actual.id)).toStrictEqual(senderWallet);
        });
    });

    describe("revert tests", () => {
        it("should test revert method", async () => {
            await handler.apply(actual);

            await expect(handler.revert(actual)).toResolve();

            // @ts-ignore
            expect(senderWallet.getAttribute("nft.base.collections")[actual.id]).toBeUndefined();
            // @ts-ignore
            expect(walletRepository.getIndex(NFTIndexers.CollectionIndexer).get(actual.id)).toBeUndefined();
        });
    });

    describe("fee tests", () => {
        it("should test dynamic fee", async () => {
            expect(
                handler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.make((Math.round(actual.serialized.length / 2) + 150) * 3));
        });

        it("should test static fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );

            expect(
                handler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.make(handler.getConstructor().staticFee()));
        });

        it("should test none fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.None,
            );
            expect(
                handler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.ZERO);
        });
    });
});
