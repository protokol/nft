import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
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
import { GuardianApplicationEvents } from "../../../src/events";
import { deregisterTransactions } from "../utils/utils";

let app: Application;

let senderWallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let handler: TransactionHandler;

let actual: Interfaces.ITransaction;

let groupsPermissionsCache;

const groupPermissionsAsset = {
    name: "group name",
    priority: 1,
    default: false,
    active: true,
    permissions: [{ types: [{ transactionType: 9000, transactionTypeGroup: 0 }], kind: PermissionKind.Allow }],
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

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

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
    >(Identifiers.CacheService);
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
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(actual)).toResolve();
        });

        it("should throw because set group permissions for specified group is already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = buildGroupPermissionsTx({
                ...groupPermissionsAsset,
                permissions: [
                    { types: [{ transactionType: 9000, transactionTypeGroup: 0 }], kind: PermissionKind.Deny },
                ],
            });
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
            transactionHistoryService.listByCriteria.mockImplementationOnce(() => ({ rows: [] }));

            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeTrue();
            await expect(handler.revert(actual)).toResolve();
            expect(await groupsPermissionsCache.has(groupPermissionsAsset.name)).toBeFalse();
            expect((await groupsPermissionsCache.keys()).length).toBe(0);
        });

        it("should test revert method if permissions were set multiple times", async () => {
            await handler.apply(actual);
            const oldPermissions = { ...groupPermissionsAsset, active: false };
            transactionHistoryService.listByCriteria.mockImplementationOnce(() => ({
                rows: [
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
