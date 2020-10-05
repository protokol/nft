import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Mocks, passphrases } from "@arkecosystem/core-test-framework";
import { Interfaces } from "@arkecosystem/crypto";
import { cloneDeep } from "@arkecosystem/utils";
import { Builders, Enums } from "@protokol/guardian-crypto";

import { Identifiers as GuardianIdentifiers, IGroupPermissions } from "../../src/interfaces";
import { PermissionResolver } from "../../src/permission-resolver";
import { GuardianIndexers } from "../../src/wallet-indexes";
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
    allow: [
        {
            transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
            transactionTypeGroup: Enums.GuardianTransactionGroup,
        },
    ],
    deny: [],
};

const defaultMockBlock: Partial<Interfaces.IBlock> = {
    data: { height: 10 } as Interfaces.IBlockData,
    transactions: [{ data: {} as Interfaces.ITransactionData } as Interfaces.ITransaction],
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

    app.get(Container.Identifiers.TransactionHandlerRegistry);

    actual = buildGroupPermissionsTx();

    groupsPermissionsCache = app.get<Contracts.Kernel.CacheStore<IGroupPermissions["name"], IGroupPermissions>>(
        Container.Identifiers.CacheService,
    );
    permissionResolver = app.get<PermissionResolver>(GuardianIdentifiers.PermissionsResolver);
    app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
        "transactionsAllowedByDefault",
        true,
    );

    Mocks.StateStore.setBlock(defaultMockBlock);
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
                "transactionsAllowedByDefault",
                false,
            );
            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should allow transaction if no permissions set and default setting is set to Allow", async () => {
            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should deny transaction if no user permissions set and active default group set to Deny", async () => {
            const defaultGroup = {
                ...groupPermissionsAsset,
                default: true,
                deny: groupPermissionsAsset.allow,
                allow: [],
            };
            await groupsPermissionsCache.put(defaultGroup.name, defaultGroup, -1);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should allow transaction if no user permissions set and active default group set to Allow", async () => {
            const defaultGroup = {
                ...groupPermissionsAsset,
                default: true,
            };
            await groupsPermissionsCache.put(defaultGroup.name, defaultGroup, -1);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should deny transaction if no user permissions set and no active default group set to Allow and default config set to Deny", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "transactionsAllowedByDefault",
                false,
            );
            const defaultGroup = {
                ...groupPermissionsAsset,
                default: true,
                active: false,
            };

            await groupsPermissionsCache.put(defaultGroup.name, defaultGroup, -1);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should deny transaction if default group with higher priority set to Deny", async () => {
            const defaultGroup1 = {
                ...groupPermissionsAsset,
                name: "group name1",
                default: true,
                priority: 1,
            };

            const defaultGroup2 = {
                ...groupPermissionsAsset,
                name: "group name2",
                default: true,
                priority: 5,
                deny: groupPermissionsAsset.allow,
                allow: [],
            };

            await groupsPermissionsCache.put(defaultGroup1.name, defaultGroup1, -1);
            await groupsPermissionsCache.put(defaultGroup2.name, defaultGroup2, -1);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should allow transaction if user permissions has Allow permission for tx type", async () => {
            const userPermissions = {
                groups: [],
                allow: groupPermissionsAsset.allow,
                deny: [],
            };
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.getIndex(GuardianIndexers.UserPermissionsIndexer).index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should deny transaction if user permissions has Deny permission for tx type", async () => {
            const userPermissions = {
                groups: [],
                allow: [],
                deny: groupPermissionsAsset.allow,
            };
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.getIndex(GuardianIndexers.UserPermissionsIndexer).index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should deny transaction if user is in group with Deny permission for tx type", async () => {
            const userGroup = {
                ...groupPermissionsAsset,
                deny: groupPermissionsAsset.allow,
                allow: [],
            };
            await groupsPermissionsCache.put(userGroup.name, userGroup, -1);
            const userPermissions = {
                groups: [userGroup.name],
                allow: [],
                deny: [],
            };
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.getIndex(GuardianIndexers.UserPermissionsIndexer).index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeFalse();
        });

        it("should allow transaction if user is in group with Allow permission for tx type", async () => {
            await groupsPermissionsCache.put(groupPermissionsAsset.name, groupPermissionsAsset, -1);
            const userPermissions = {
                groups: [groupPermissionsAsset.name],
                allow: [],
                deny: [],
            };
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.getIndex(GuardianIndexers.UserPermissionsIndexer).index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should allow transaction if user has no permission and not in any group and default config set to Allow", async () => {
            const userPermissions = {
                groups: [],
                allow: [],
                deny: [],
            };
            senderWallet.setAttribute("guardian.userPermissions", userPermissions);
            walletRepository.getIndex(GuardianIndexers.UserPermissionsIndexer).index(senderWallet);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should allow transaction if it is first block", async () => {
            const mockBlock = cloneDeep(defaultMockBlock);
            mockBlock.data!.height = 1;
            Mocks.StateStore.setBlock(mockBlock);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should allow transaction if genesis", async () => {
            const mockBlock = cloneDeep(defaultMockBlock);
            mockBlock.transactions![0].data.senderPublicKey = senderWallet.publicKey;
            Mocks.StateStore.setBlock(mockBlock);

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should use cached genesis publicKey to check permissions", async () => {
            const mockBlock = cloneDeep(defaultMockBlock);
            mockBlock.transactions![0].data.senderPublicKey = senderWallet.publicKey;
            Mocks.StateStore.setBlock(mockBlock);

            await permissionResolver.resolve(actual);
            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });

        it("should allow transaction if user is masterPublicKey", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "masterPublicKey",
                senderWallet.publicKey,
            );

            const isTxAllowed = await permissionResolver.resolve(actual);

            expect(isTxAllowed).toBeTrue();
        });
    });
});
