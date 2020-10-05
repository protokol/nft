import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Enums } from "@protokol/guardian-crypto";

import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { FeeType } from "../../../src/enums";
import {
    DuplicatePermissionsError,
    StaticFeeMismatchError,
    TransactionTypeDoesntExistError,
} from "../../../src/errors";
import { GuardianApplicationEvents } from "../../../src/events";
import { IGroupPermissions } from "../../../src/interfaces";
import { deregisterTransactions } from "../utils/utils";

let app: Application;

let senderWallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let handler: Handlers.TransactionHandler;

let actual: Interfaces.ITransaction;

let groupsPermissionsCache;

const groupPermissionsAsset = {
    name: "group name",
    priority: 1,
    default: false,
    active: true,
    allow: [
        {
            transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
            transactionTypeGroup: Enums.GuardianTransactionGroup,
        },
    ],
    deny: [],
};

const buildGroupPermissionsTx = (asset?, nonce?, fee?) =>
    new Builders.GuardianGroupPermissionsBuilder()
        .GuardianGroupPermissions(asset || groupPermissionsAsset)
        .nonce(nonce || "1")
        .sign(passphrases[0])
        .fee(fee || Enums.GuardianStaticFees.GuardianSetGroupPermissions)
        .build();

beforeEach(() => {
    app = initApp();

    senderWallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

    handler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
            Enums.GuardianTransactionGroup,
        ),
        2,
    );
    walletRepository.index(senderWallet);

    actual = buildGroupPermissionsTx();

    groupsPermissionsCache = app.get<Contracts.Kernel.CacheStore<IGroupPermissions["name"], IGroupPermissions>>(
        Container.Identifiers.CacheService,
    );
});

afterEach(() => {
    deregisterTransactions();
});

describe("Guardian set group permissions tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });

            await expect(handler.bootstrap()).toResolve();
            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeTrue();
            expect(await groupsPermissionsCache.get(groupPermissionsAsset.name)).toStrictEqual(groupPermissionsAsset);
        });

        it("bootstrap should throw if no asset defined", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield { ...actual.data, asset: undefined };
            });

            await expect(handler.bootstrap()).toReject();
            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeFalse();
            expect((await groupsPermissionsCache.keys()).length).toBe(0);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if setGroupPermissions is undefined", async () => {
            const undefinedTokenInTransaction = { ...actual };
            undefinedTokenInTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(undefinedTokenInTransaction, senderWallet)).toReject();
        });

        it("should throw if permissions array contains duplicates", async () => {
            const type = {
                transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
                transactionTypeGroup: Enums.GuardianTransactionGroup,
            };
            const allow = [type];
            const deny = [type];
            actual = buildGroupPermissionsTx({ ...groupPermissionsAsset, allow, deny });

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                DuplicatePermissionsError,
            );
        });

        it("should not throw if permissions array contains distinct values", async () => {
            const typeOne = {
                transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
                transactionTypeGroup: Enums.GuardianTransactionGroup,
            };
            const typeTwo = {
                transactionType: Enums.GuardianTransactionTypes.GuardianSetUserPermissions,
                transactionTypeGroup: Enums.GuardianTransactionGroup,
            };
            const typeThree = { transactionType: 0, transactionTypeGroup: 1 };
            const allow = [typeOne, typeTwo];
            const deny = [typeThree];
            actual = buildGroupPermissionsTx({ ...groupPermissionsAsset, allow, deny });

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if types array in permissions contains non existing type", async () => {
            const type = {
                transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions + 10,
                transactionTypeGroup: Enums.GuardianTransactionGroup,
            };
            const allow = [type];
            actual = buildGroupPermissionsTx({ ...groupPermissionsAsset, allow });

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                TransactionTypeDoesntExistError,
            );
        });

        it("should throw StaticFeeMismatchError", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );

            actual = buildGroupPermissionsTx(undefined, undefined, "1");

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                StaticFeeMismatchError,
            );
        });

        it("should not throw if fee is the same as static fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(actual)).toResolve();
        });

        it("should throw because set group permissions for specified group is already in pool", async () => {
            await app.get<Mempool>(Container.Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = buildGroupPermissionsTx({
                ...groupPermissionsAsset,
                allow: [
                    {
                        transactionType: Enums.GuardianTransactionTypes.GuardianSetUserPermissions,
                        transactionTypeGroup: Enums.GuardianTransactionGroup,
                    },
                ],
            });
            await expect(handler.throwIfCannotEnterPool(actualTwo)).rejects.toThrow();
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Container.Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(GuardianApplicationEvents.SetGroupPermissions, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should test apply method", async () => {
            await expect(handler.apply(actual)).toResolve();
            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeTrue();
            expect(await groupsPermissionsCache.get(groupPermissionsAsset.name)).toStrictEqual(groupPermissionsAsset);
        });

        it("should overwrite existing group in apply method", async () => {
            const actualTwo = buildGroupPermissionsTx({ ...groupPermissionsAsset, active: false }, "2");
            // allow and deny arrays are sanitizet before saving
            const actualTwoAsset = { ...actualTwo.data.asset!.setGroupPermissions, deny: [] };
            await handler.apply(actual);

            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeTrue();
            expect(await groupsPermissionsCache.get(groupPermissionsAsset.name)).toStrictEqual(groupPermissionsAsset);
            await handler.apply(actualTwo);
            expect(await groupsPermissionsCache.get(groupPermissionsAsset.name)).toStrictEqual(actualTwoAsset);
        });
    });

    describe("revert tests", () => {
        it("should test revert method if group permissions were set only once", async () => {
            await handler.apply(actual);
            transactionHistoryService.listByCriteria.mockImplementationOnce(() => ({ results: [] }));

            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeTrue();
            await expect(handler.revert(actual)).toResolve();
            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeFalse();
            expect((await groupsPermissionsCache.keys()).length).toBe(0);
        });

        it("should test revert method if permissions were set multiple times", async () => {
            await handler.apply(actual);
            const oldPermissions = { ...groupPermissionsAsset, active: false };
            transactionHistoryService.listByCriteria.mockImplementationOnce(() => ({
                results: [
                    {
                        asset: {
                            setGroupPermissions: oldPermissions,
                        },
                    },
                ],
            }));

            await expect(handler.revert(actual)).toResolve();
            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeTrue();
            expect(await groupsPermissionsCache.get(groupPermissionsAsset.name)).toStrictEqual(oldPermissions);
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
