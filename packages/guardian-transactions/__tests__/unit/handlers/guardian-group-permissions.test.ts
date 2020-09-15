import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Builders, Enums, Interfaces as GuardianInterfaces } from "@protokol/guardian-crypto";

import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { DuplicatePermissionsError, TransactionTypeDoesntExistError } from "../../../src/errors";
import { GuardianApplicationEvents } from "../../../src/events";
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
    permissions: [
        {
            types: [
                {
                    transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
                    transactionTypeGroup: Enums.GuardianTransactionGroup,
                },
            ],
            kind: Enums.PermissionKind.Allow,
        },
    ],
};

const buildGroupPermissionsTx = (asset?, nonce?) =>
    new Builders.GuardianGroupPermissionsBuilder()
        .GuardianGroupPermissions(asset || groupPermissionsAsset)
        .nonce(nonce || "1")
        .sign(passphrases[0])
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

    groupsPermissionsCache = app.get<
        Contracts.Kernel.CacheStore<
            GuardianInterfaces.GuardianGroupPermissionsAsset["name"],
            GuardianInterfaces.GuardianGroupPermissionsAsset
        >
    >(Container.Identifiers.CacheService);
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

        it("should throw if types array in permissions contains duplicates", async () => {
            const type = {
                transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
                transactionTypeGroup: Enums.GuardianTransactionGroup,
            };
            const permissions = [{ types: [type, type], kind: Enums.PermissionKind.Allow }];
            actual = buildGroupPermissionsTx({ ...groupPermissionsAsset, permissions });

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                DuplicatePermissionsError,
            );
        });

        it("should throw if permissions array contains duplicates", async () => {
            const type = {
                transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
                transactionTypeGroup: Enums.GuardianTransactionGroup,
            };
            const permissions = [
                { types: [type], kind: Enums.PermissionKind.Allow },
                { types: [type], kind: Enums.PermissionKind.Deny },
            ];
            actual = buildGroupPermissionsTx({ ...groupPermissionsAsset, permissions });

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
            const permissions = [
                { types: [typeOne, typeTwo], kind: Enums.PermissionKind.Allow },
                { types: [typeThree], kind: Enums.PermissionKind.Deny },
            ];
            actual = buildGroupPermissionsTx({ ...groupPermissionsAsset, permissions });

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if types array in permissions contains non existing type", async () => {
            const type = {
                transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions + 10,
                transactionTypeGroup: Enums.GuardianTransactionGroup,
            };
            const permissions = [{ types: [type], kind: Enums.PermissionKind.Allow }];
            actual = buildGroupPermissionsTx({ ...groupPermissionsAsset, permissions });

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                TransactionTypeDoesntExistError,
            );
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
                permissions: [
                    {
                        types: [
                            {
                                transactionType: Enums.GuardianTransactionTypes.GuardianSetUserPermissions,
                                transactionTypeGroup: Enums.GuardianTransactionGroup,
                            },
                        ],
                        kind: Enums.PermissionKind.Deny,
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
            await handler.apply(actual);

            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeTrue();
            expect(await groupsPermissionsCache.get(groupPermissionsAsset.name)).toStrictEqual(groupPermissionsAsset);
            await handler.apply(actualTwo);
            expect(await groupsPermissionsCache.get(groupPermissionsAsset.name)).toStrictEqual(
                actualTwo.data.asset!.setGroupPermissions,
            );
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
});
