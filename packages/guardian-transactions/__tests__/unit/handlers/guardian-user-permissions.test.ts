import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { Handlers } from "@arkecosystem/core-transactions";
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
import { IGroupPermissions, IUserPermissions } from "../../../src/interfaces";
import { GuardianIndexers } from "../../../src/wallet-indexes";
import { deregisterTransactions } from "../utils/utils";

let app: Application;

let senderWallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let handler: Handlers.TransactionHandler;

let actual: Interfaces.ITransaction;

const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
const userPermissions: IUserPermissions = {
    groups: ["group name"],
    allow: [
        {
            transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
            transactionTypeGroup: Enums.GuardianTransactionGroup,
        },
    ],
    deny: [],
};

const buildUserPermissionsAsset = (
    publicKey,
    groups?,
    allow?,
    deny?,
): GuardianInterfaces.IGuardianUserPermissionsAsset => ({ groupNames: groups, publicKey, allow, deny });

const buildUserPermissionsTx = (publicKey, groups?, allow?, deny?) =>
    new Builders.GuardianUserPermissionsBuilder()
        .GuardianUserPermissions(buildUserPermissionsAsset(publicKey, groups, allow, deny))
        .nonce("1")
        .sign(passphrases[0])
        .build();

beforeEach(async () => {
    app = initApp();

    senderWallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

    handler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.GuardianTransactionTypes.GuardianSetUserPermissions,
            Enums.GuardianTransactionGroup,
        ),
        2,
    );
    walletRepository.index(senderWallet);

    actual = buildUserPermissionsTx(publicKey, userPermissions.groups, userPermissions.allow, userPermissions.deny);

    const groupsPermissionsCache = app.get<Contracts.Kernel.CacheStore<IGroupPermissions["name"], IGroupPermissions>>(
        Container.Identifiers.CacheService,
    );
    await groupsPermissionsCache.put(userPermissions.groups[0], {} as IGroupPermissions, -1);
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
                senderWallet.getAttribute<GuardianInterfaces.IGuardianUserPermissionsAsset>("guardian.userPermissions"),
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
            actual = buildUserPermissionsTx(publicKey);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if groupName doesn't exists in cache", async () => {
            actual = buildUserPermissionsTx(publicKey, ["non existing group"]);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                GroupDoesntExistError,
            );
        });

        it("should throw if permissions array contains duplicates", async () => {
            const permissions = [
                {
                    transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
                    transactionTypeGroup: Enums.GuardianTransactionGroup,
                },
            ];
            actual = buildUserPermissionsTx(publicKey, undefined, permissions, permissions);

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
            actual = buildUserPermissionsTx(publicKey, undefined, allow, deny);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if types array in permissions contains non existing type", async () => {
            const permissions = [
                {
                    transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions + 10,
                    transactionTypeGroup: Enums.GuardianTransactionGroup,
                },
            ];
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
            await app.get<Mempool>(Container.Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = buildUserPermissionsTx(publicKey);
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

            expect(spy).toHaveBeenCalledWith(GuardianApplicationEvents.SetUserPermissions, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should test apply method", async () => {
            await expect(handler.apply(actual)).toResolve();

            expect(
                senderWallet.getAttribute<GuardianInterfaces.IGuardianUserPermissionsAsset>("guardian.userPermissions"),
            ).toStrictEqual(userPermissions);

            expect(
                walletRepository.findByIndex(
                    GuardianIndexers.UserPermissionsIndexer,
                    actual.data.asset!.setUserPermissions.publicKey,
                ),
            ).toStrictEqual(senderWallet);
        });

        it("should set empty array if groupNames or permissions arrays are missing", async () => {
            actual = buildUserPermissionsTx(publicKey);
            await expect(handler.apply(actual)).toResolve();

            expect(
                senderWallet.getAttribute<GuardianInterfaces.IGuardianUserPermissionsAsset>("guardian.userPermissions"),
            ).toStrictEqual({
                groups: [],
                allow: [],
                deny: [],
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
            transactionHistoryService.listByCriteria.mockImplementationOnce(() => ({ results: [] }));

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
                allow: [
                    {
                        transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
                        transactionTypeGroup: Enums.GuardianTransactionGroup,
                    },
                ],
                deny: [],
            };
            transactionHistoryService.listByCriteria.mockImplementationOnce(() => ({
                results: [
                    {
                        asset: {
                            setUserPermissions: buildUserPermissionsAsset(
                                publicKey,
                                oldPermissions.groups,
                                oldPermissions.allow,
                                oldPermissions.deny,
                            ),
                        },
                    },
                ],
            }));

            await expect(handler.revert(actual)).toResolve();

            expect(
                senderWallet.getAttribute<GuardianInterfaces.IGuardianUserPermissionsAsset>("guardian.userPermissions"),
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
