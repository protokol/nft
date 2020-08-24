import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Builders, Enums, Interfaces as GuardianInterfaces } from "@protokol/guardian-crypto";

import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import {
    DuplicatePermissionsError,
    GroupDoesntExistError,
    TransactionTypeDoesntExistError,
    UserInToManyGroupsError,
} from "../../../src/errors";
import { GuardianApplicationEvents } from "../../../src/events";
import { IUserPermissions } from "../../../src/interfaces";
import { GuardianIndexers } from "../../../src/wallet-indexes";
import { deregisterTransactions } from "../utils/utils";

let app: Application;

let senderWallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let handler: TransactionHandler;

let actual: Interfaces.ITransaction;

const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
const userPermissions: IUserPermissions = {
    groups: ["group name"],
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

const buildUserPermissionsAsset = (
    publicKey,
    groups,
    permissions,
): GuardianInterfaces.GuardianUserPermissionsAsset => ({ groupNames: groups, publicKey, permissions });

const buildUserPermissionsTx = (publicKey, groups, permissions) =>
    new Builders.GuardianUserPermissionsBuilder()
        .GuardianUserPermissions(buildUserPermissionsAsset(publicKey, groups, permissions))
        .nonce("1")
        .sign(passphrases[0])
        .build();

beforeEach(async () => {
    app = initApp();

    senderWallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    handler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.GuardianTransactionTypes.GuardianSetUserPermissions,
            Enums.GuardianTransactionGroup,
        ),
        2,
    );
    walletRepository.index(senderWallet);

    actual = buildUserPermissionsTx(publicKey, userPermissions.groups, userPermissions.permissions);

    const groupsPermissionsCache = app.get<
        Contracts.Kernel.CacheStore<
            GuardianInterfaces.GuardianGroupPermissionsAsset["name"],
            GuardianInterfaces.GuardianGroupPermissionsAsset
        >
    >(Identifiers.CacheService);
    await groupsPermissionsCache.put(
        userPermissions.groups[0],
        {} as GuardianInterfaces.GuardianGroupPermissionsAsset,
        -1,
    );
});

afterEach(() => {
    deregisterTransactions();
});

describe("Guardian set user permissions tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });

            await expect(handler.bootstrap()).toResolve();

            expect(
                senderWallet.getAttribute<GuardianInterfaces.GuardianUserPermissionsAsset>("guardian.userPermissions"),
            ).toStrictEqual(userPermissions);

            expect(
                walletRepository.findByIndex(
                    GuardianIndexers.UserPermissionsIndexer,
                    actual.data.asset!.setUserPermissions.publicKey,
                ),
            ).toStrictEqual(senderWallet);
        });

        it("bootstrap should throw if no asset defined", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield { ...actual.data, asset: undefined };
            });

            await expect(handler.bootstrap()).toReject();

            expect(senderWallet.hasAttribute("guardian.userPermissions")).toBeFalse();
            expect(
                walletRepository.hasByIndex(
                    GuardianIndexers.UserPermissionsIndexer,
                    actual.data.asset!.setUserPermissions.publicKey,
                ),
            ).toBeFalse();
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if setUserPermissions is undefined", async () => {
            const undefinedTokenInTransaction = { ...actual };
            undefinedTokenInTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(undefinedTokenInTransaction, senderWallet)).toReject();
        });

        it("should prevent to set user permissions if user belongs in too many groups", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "maxDefinedGroupsPerUser",
                0,
            );

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                UserInToManyGroupsError,
            );
        });

        it("should not check maxDefinedGroupsPerUser if user doesn't belong in any groups", async () => {
            actual = buildUserPermissionsTx(publicKey, undefined, userPermissions.permissions);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if groupName doesn't exists in cache", async () => {
            actual = buildUserPermissionsTx(publicKey, ["non existing group"], undefined);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                GroupDoesntExistError,
            );
        });

        it("should throw if types array in permissions contains duplicates", async () => {
            const type = {
                transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
                transactionTypeGroup: Enums.GuardianTransactionGroup,
            };
            const permissions = [{ types: [type, type], kind: Enums.PermissionKind.Allow }];
            actual = buildUserPermissionsTx(publicKey, undefined, permissions);

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
            actual = buildUserPermissionsTx(publicKey, undefined, permissions);

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
            actual = buildUserPermissionsTx(publicKey, undefined, permissions);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if types array in permissions contains non existing type", async () => {
            const type = {
                transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions + 10,
                transactionTypeGroup: Enums.GuardianTransactionGroup,
            };
            const permissions = [{ types: [type, type], kind: Enums.PermissionKind.Allow }];
            actual = buildUserPermissionsTx(publicKey, undefined, permissions);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                TransactionTypeDoesntExistError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(actual)).toResolve();
        });

        it("should throw because set user permissions for specified publicKey is already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = buildUserPermissionsTx(publicKey, undefined, undefined);
            await expect(handler.throwIfCannotEnterPool(actualTwo)).rejects.toThrow();
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(GuardianApplicationEvents.SetUserPermissions, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should test apply method", async () => {
            await expect(handler.apply(actual)).toResolve();

            expect(
                senderWallet.getAttribute<GuardianInterfaces.GuardianUserPermissionsAsset>("guardian.userPermissions"),
            ).toStrictEqual(userPermissions);

            expect(
                walletRepository.findByIndex(
                    GuardianIndexers.UserPermissionsIndexer,
                    actual.data.asset!.setUserPermissions.publicKey,
                ),
            ).toStrictEqual(senderWallet);
        });

        it("should set empty array if groupNames or permissions arrays are missing", async () => {
            actual = buildUserPermissionsTx(publicKey, undefined, undefined);
            await expect(handler.apply(actual)).toResolve();

            expect(
                senderWallet.getAttribute<GuardianInterfaces.GuardianUserPermissionsAsset>("guardian.userPermissions"),
            ).toStrictEqual({
                groups: [],
                permissions: [],
            });

            expect(
                walletRepository.findByIndex(
                    GuardianIndexers.UserPermissionsIndexer,
                    actual.data.asset!.setUserPermissions.publicKey,
                ),
            ).toStrictEqual(senderWallet);
        });
    });

    describe("revert tests", () => {
        it("should test revert method if permissions were set only once", async () => {
            await handler.apply(actual);
            transactionHistoryService.listByCriteria.mockImplementationOnce(() => ({ rows: [] }));

            await expect(handler.revert(actual)).toResolve();

            expect(senderWallet.hasAttribute("guardian.userPermissions")).toBeFalse();
            expect(
                walletRepository.hasByIndex(
                    GuardianIndexers.UserPermissionsIndexer,
                    actual.data.asset!.setUserPermissions.publicKey,
                ),
            ).toBeFalse();
        });

        it("should test revert method if permissions were set multiple times", async () => {
            await handler.apply(actual);
            const oldPermissions: IUserPermissions = {
                groups: [],
                permissions: [
                    {
                        types: [
                            {
                                transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
                                transactionTypeGroup: Enums.GuardianTransactionGroup,
                            },
                        ],
                        kind: Enums.PermissionKind.Deny,
                    },
                ],
            };
            transactionHistoryService.listByCriteria.mockImplementationOnce(() => ({
                rows: [
                    {
                        asset: {
                            setUserPermissions: buildUserPermissionsAsset(
                                publicKey,
                                oldPermissions.groups,
                                oldPermissions.permissions,
                            ),
                        },
                    },
                ],
            }));

            await expect(handler.revert(actual)).toResolve();

            expect(
                senderWallet.getAttribute<GuardianInterfaces.GuardianUserPermissionsAsset>("guardian.userPermissions"),
            ).toStrictEqual(oldPermissions);
            expect(
                walletRepository.findByIndex(
                    GuardianIndexers.UserPermissionsIndexer,
                    actual.data.asset!.setUserPermissions.publicKey,
                ),
            ).toStrictEqual(senderWallet);
        });
    });
});
