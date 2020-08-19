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
import { PermissionKind } from "../../../../guardian-crypto/src/enums";
import { UserInToManyGroupsError } from "../../../src/errors";
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
    permissions: [{ types: [{ transactionType: 9000, transactionTypeGroup: 0 }], kind: PermissionKind.Allow }],
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

beforeEach(() => {
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
                    { types: [{ transactionType: 9000, transactionTypeGroup: 0 }], kind: PermissionKind.Deny },
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
