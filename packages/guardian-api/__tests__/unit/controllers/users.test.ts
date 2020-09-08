import "jest-extended";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Managers, Transactions } from "@arkecosystem/crypto";
import { configManager } from "@arkecosystem/crypto/src/managers";
import Hapi from "@hapi/hapi";
import {
    Enums,
    Interfaces as GuardianInterfaces,
    Transactions as GuardianTransactions,
} from "@protokol/guardian-crypto";

import { buildWallet, CollectionResponse, ErrorResponse, initApp, ItemResponse } from "../__support__";
import { GuardianIndexers } from "../../../../guardian-transactions/src/wallet-indexes";
import { UsersController } from "../../../src/controllers/users";

let userController: UsersController;

const users: any = [
    {
        groups: ["group name1"],
        permissions: [
            { kind: Enums.PermissionKind.Allow, types: [{ transactionType: 9000, transactionTypeGroup: 0 }] },
        ],
    },
    {
        groups: ["group name2"],
        permissions: [],
    },
];

const groups = {
    "group name1": {
        name: "group name1",
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
    },
    "group name2": {
        name: "group name2",
        priority: 2,
        default: false,
        active: true,
        permissions: [
            {
                types: [{ transactionType: 9000, transactionTypeGroup: 0 }],
                kind: Enums.PermissionKind.Deny,
            },
        ],
    },
};

beforeEach(async () => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    const app = initApp();

    const walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    userController = app.resolve<UsersController>(UsersController);

    const groupsPermissionsCache = app.get<
        Contracts.Kernel.CacheStore<
            GuardianInterfaces.GuardianGroupPermissionsAsset["name"],
            GuardianInterfaces.GuardianGroupPermissionsAsset
        >
    >(Identifiers.CacheService);

    // set mock users and groups
    for (let i = 0; i < users.length; i++) {
        const wallet = buildWallet(app, passphrases[i]);
        wallet.setAttribute("guardian.userPermissions", users[i]);
        walletRepository.getIndex(GuardianIndexers.UserPermissionsIndexer).index(wallet);
        users[i].publicKey = wallet.publicKey;
        await groupsPermissionsCache.put(
            users[i].groups[0],
            groups[users[i].groups[0]] as GuardianInterfaces.GuardianGroupPermissionsAsset,
            -1,
        );
    }
});

afterEach(() => {
    Transactions.TransactionRegistry.deregisterTransactionType(
        GuardianTransactions.GuardianGroupPermissionsTransaction,
    );
    Transactions.TransactionRegistry.deregisterTransactionType(GuardianTransactions.GuardianUserPermissionsTransaction);
});

describe("Test user controller", () => {
    it("index - return all users", async () => {
        const response = (await userController.index(undefined, undefined)) as CollectionResponse;

        expect(response.data.length).toBe(users.length);
        expect(response.data[0]).toStrictEqual(users[0]);
    });

    it("show - return user by id", async () => {
        const request: Hapi.Request = {
            params: {
                id: users[0].publicKey,
            },
        };

        const response = (await userController.show(request, undefined)) as ItemResponse;

        expect(response.data).toStrictEqual(users[0]);
    });

    it("show - should return 404 if user does not exist", async () => {
        const request: Hapi.Request = {
            params: {
                id: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
            },
        };

        const response = (await userController.show(request, undefined)) as ErrorResponse;

        expect(response.output.statusCode).toBe(404);
    });

    it("showGroups - return user's groups", async () => {
        const request: Hapi.Request = {
            params: {
                id: users[0].publicKey,
            },
        };

        const response = (await userController.showGroups(request, undefined)) as CollectionResponse;

        expect(response.data.length).toBe(1);
        expect(response.data[0]).toStrictEqual(groups[users[0].groups[0]]);
    });

    it("showGroups - should return 404 if user does not exist", async () => {
        const request: Hapi.Request = {
            params: {
                id: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
            },
        };

        const response = (await userController.showGroups(request, undefined)) as ErrorResponse;

        expect(response.output.statusCode).toBe(404);
    });
});
