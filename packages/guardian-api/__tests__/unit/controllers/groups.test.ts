import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
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
import { Indexers } from "@protokol/guardian-transactions";

import { buildWallet, CollectionResponse, ErrorResponse, initApp, ItemResponse } from "../__support__";
import { GroupsController } from "../../../src/controllers/groups";

let app: Application;

let groupController: GroupsController;

let walletRepository: Wallets.WalletRepository;

const groups = [
    {
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
    {
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
];

beforeEach(async () => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    groupController = app.resolve<GroupsController>(GroupsController);

    const groupsPermissionsCache = app.get<
        Contracts.Kernel.CacheStore<
            GuardianInterfaces.GuardianGroupPermissionsAsset["name"],
            GuardianInterfaces.GuardianGroupPermissionsAsset
        >
    >(Identifiers.CacheService);

    //set mock groups
    for (const group of groups) {
        await groupsPermissionsCache.put(group.name, group, -1);
    }
});

afterEach(() => {
    Transactions.TransactionRegistry.deregisterTransactionType(
        GuardianTransactions.GuardianGroupPermissionsTransaction,
    );
    Transactions.TransactionRegistry.deregisterTransactionType(GuardianTransactions.GuardianUserPermissionsTransaction);
});

describe("Test group controller", () => {
    it("index - return all users", async () => {
        const response = (await groupController.index(undefined, undefined)) as CollectionResponse;

        expect(response.data.length).toBe(groups.length);
        expect(response.data[0]).toStrictEqual(groups[0]);
    });

    it("show - return group by id", async () => {
        const request: Hapi.Request = {
            params: {
                id: groups[0].name,
            },
        };

        const response = (await groupController.show(request, undefined)) as ItemResponse;

        expect(response.data).toStrictEqual(groups[0]);
    });

    it("show - should return 404 if group does not exist", async () => {
        const request: Hapi.Request = {
            params: {
                id: "non-existing",
            },
        };

        const response = (await groupController.show(request, undefined)) as ErrorResponse;

        expect(response.output.statusCode).toBe(404);
    });

    it("showUsers - return group's users", async () => {
        const request: Hapi.Request = {
            params: {
                id: groups[0].name,
            },
        };

        const user = {
            groups: ["group name1"],
            permissions: [],
        };
        const wallet = buildWallet(app, passphrases[0]);
        wallet.setAttribute("guardian.userPermissions", user);
        walletRepository.getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer).index(wallet);

        const response = (await groupController.showUsers(request, undefined)) as CollectionResponse;

        expect(response.data.length).toBe(1);
        expect(response.data[0]).toStrictEqual({ ...user, publicKey: wallet.publicKey });
    });

    it("showUsers - should return 404 if group does not exist", async () => {
        const request: Hapi.Request = {
            params: {
                id: "non-existing",
            },
        };

        const response = (await groupController.showUsers(request, undefined)) as ErrorResponse;

        expect(response.output.statusCode).toBe(404);
    });
});
