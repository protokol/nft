import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Interfaces } from "@arkecosystem/crypto";
import { cloneDeep } from "@arkecosystem/utils";
import { Builders, Enums, Interfaces as GuardianInterfaces } from "@protokol/guardian-crypto";

import { Identifiers as GuardianIdentifiers } from "../../src/interfaces";
import { PermissionResolver } from "../../src/permission-resolver";
import { buildWallet, initApp } from "./__support__/app";
import { deregisterTransactions } from "./utils/utils";

let app: Application;

let senderWallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let actual: Interfaces.ITransaction;

let groupsPermissionsCache;

let permissionResolver: PermissionResolver;

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

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    app.get(Identifiers.TransactionHandlerRegistry);

    actual = buildGroupPermissionsTx();

    groupsPermissionsCache = app.get<
        Contracts.Kernel.CacheStore<
            GuardianInterfaces.GuardianGroupPermissionsAsset["name"],
            GuardianInterfaces.GuardianGroupPermissionsAsset
        >
    >(Identifiers.CacheService);
    permissionResolver = app.get<PermissionResolver>(GuardianIdentifiers.PermissionsResolver);
    app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
        "defaultRuleBehaviour",
        Enums.PermissionKind.Allow,
    );
});

afterEach(() => {
    deregisterTransactions();
});

describe("Guardian permission resolver tests", () => {
    describe("resolve tests", () => {
        it("should throw if no publicKey", async () => {
            delete actual.data.senderPublicKey;

            await expect(permissionResolver.resolve(actual)).toReject();
        });

        it("should deny transaction if no permissions set and default setting is set to Deny", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "defaultRuleBehaviour",
                Enums.PermissionKind.Deny,
            );
            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should allow transaction if no permissions set and default setting is set to Allow", async () => {
            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should deny transaction if no user permissions set and active default group set to Deny", async () => {
            const defaultGroup = { ...cloneDeep(groupPermissionsAsset), default: true };
            defaultGroup.permissions[0].kind = Enums.PermissionKind.Deny;
            await groupsPermissionsCache.put(defaultGroup.name, defaultGroup, -1);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should allow transaction if no user permissions set and active default group set to Allow", async () => {
            const defaultGroup = { ...cloneDeep(groupPermissionsAsset), default: true };
            defaultGroup.permissions[0].kind = Enums.PermissionKind.Allow;
            await groupsPermissionsCache.put(defaultGroup.name, defaultGroup, -1);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should deny transaction if no user permissions set and no active default group set to Allow and default config set to Deny", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "defaultRuleBehaviour",
                Enums.PermissionKind.Deny,
            );
            const defaultGroup = { ...cloneDeep(groupPermissionsAsset), default: true, active: false };
            defaultGroup.permissions[0].kind = Enums.PermissionKind.Allow;
            await groupsPermissionsCache.put(defaultGroup.name, defaultGroup, -1);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should deny transaction if default group with higher priority set to Deny", async () => {
            const defaultGroup1 = {
                ...cloneDeep(groupPermissionsAsset),
                name: "group name1",
                default: true,
                priority: 1,
            };
            defaultGroup1.permissions[0].kind = Enums.PermissionKind.Allow;
            const defaultGroup2 = {
                ...cloneDeep(groupPermissionsAsset),
                name: "group name2",
                default: true,
                priority: 5,
            };
            defaultGroup2.permissions[0].kind = Enums.PermissionKind.Deny;
            await groupsPermissionsCache.put(defaultGroup1.name, defaultGroup1, -1);
            await groupsPermissionsCache.put(defaultGroup2.name, defaultGroup2, -1);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should allow transaction if user permissions has Allow permission for tx type", async () => {
            const userPermissions = {
                groups: [],
                permissions: cloneDeep(groupPermissionsAsset.permissions),
            };
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should deny transaction if user permissions has Deny permission for tx type", async () => {
            const userPermissions = {
                groups: [],
                permissions: cloneDeep(groupPermissionsAsset.permissions),
            };
            userPermissions.permissions[0].kind = Enums.PermissionKind.Deny;
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should deny transaction if user is in group with Deny permission for tx type", async () => {
            const userGroup = { ...cloneDeep(groupPermissionsAsset) };
            userGroup.permissions[0].kind = Enums.PermissionKind.Deny;
            await groupsPermissionsCache.put(userGroup.name, userGroup, -1);
            const userPermissions = {
                groups: [userGroup.name],
                permissions: [],
            };
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should allow transaction if user is in group with Allow permission for tx type", async () => {
            const userGroup = { ...cloneDeep(groupPermissionsAsset) };
            await groupsPermissionsCache.put(userGroup.name, userGroup, -1);
            const userPermissions = {
                groups: [userGroup.name],
                permissions: [],
            };
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should allow transaction if user has no permission and not in any group and default config set to Allow", async () => {
            const userPermissions = {
                groups: [],
                permissions: [],
            };
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });
    });
});
