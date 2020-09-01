import "@arkecosystem/core-test-framework/src/matchers";

import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { ApiHelpers } from "@arkecosystem/core-test-framework/src";
import { Enums, Interfaces } from "@protokol/guardian-crypto";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

const users: any = [
    {
        groups: ["group name1"],
        permissions: [
            { kind: Enums.PermissionKind.Allow, types: [{ transactionType: 9000, transactionTypeGroup: 0 }] },
        ],
        publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    },
    {
        groups: ["group name2"],
        permissions: [],
        publicKey: "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
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

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);

    const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const groupsPermissionsCache = app.getTagged<
        Contracts.Kernel.CacheStore<
            Interfaces.GuardianGroupPermissionsAsset["name"],
            Interfaces.GuardianGroupPermissionsAsset
        >
    >(Identifiers.CacheService, "cache", "@protokol/guardian-transactions");

    // set mock users and groups
    for (let i = 0; i < users.length; i++) {
        const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(users[i].publicKey);
        wallet.setAttribute("guardian.userPermissions", users[i]);
        walletRepository.index(wallet);
        await groupsPermissionsCache.put(
            users[i].groups[0],
            groups[users[i].groups[0]] as Interfaces.GuardianGroupPermissionsAsset,
            -1,
        );
    }
});

afterAll(async () => await tearDown());

describe("API - Users", () => {
    describe("GET /guardian/users", () => {
        it("should GET get all users", async () => {
            const response = await api.request("GET", "guardian/users");

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data.length).toBe(2);
            expect(response.data.data[0]).toStrictEqual(users[0]);
        });
    });

    describe("GET /guardian/users/{id}", () => {
        it("should GET user by id", async () => {
            const response = await api.request("GET", `guardian/users/${users[0].publicKey}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toStrictEqual(users[0]);
        });

        it("should fail to GET a user by id if it doesn't exist", async () => {
            api.expectError(
                await api.request(
                    "GET",
                    "guardian/users/022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
                ),
            );
        });
    });

    describe("GET /guardian/users/{id}/groups", () => {
        it("should GET user's groups", async () => {
            const response = await api.request("GET", `guardian/users/${users[0].publicKey}/groups`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data.length).toBe(1);
            expect(response.data.data[0]).toStrictEqual(groups[users[0].groups[0]]);
        });

        it("should fail to GET a users's groups if user doesn't exist", async () => {
            api.expectError(
                await api.request(
                    "GET",
                    "guardian/users/022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0/groups",
                ),
            );
        });
    });
});
