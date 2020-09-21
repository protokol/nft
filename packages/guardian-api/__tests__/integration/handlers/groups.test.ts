import "@arkecosystem/core-test-framework/dist/matchers";

import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework";
import { Enums, Interfaces } from "@protokol/guardian-crypto";
import { Indexers } from "@protokol/guardian-transactions";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

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

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);

    const groupsPermissionsCache = app.getTagged<
        Contracts.Kernel.CacheStore<
            Interfaces.GuardianGroupPermissionsAsset["name"],
            Interfaces.GuardianGroupPermissionsAsset
        >
    >(Container.Identifiers.CacheService, "cache", "@protokol/guardian-transactions");

    // set mock groups
    for (const group of groups) {
        await groupsPermissionsCache.put(group.name, group, -1);
    }
});

afterAll(async () => await tearDown());

describe("API - Groups", () => {
    describe("GET /guardian/groups", () => {
        it("should GET get all groups", async () => {
            const response = await api.request("GET", "guardian/groups");

            expect(response).toBeSuccessfulResponse();
            api.expectPaginator(response);
            expect(response.data.data).toBeArray();
            expect(response.data.data.length).toBe(2);
            expect(response.data.data[0]).toStrictEqual(groups[0]);
        });
    });

    describe("GET /guardian/groups/{id}", () => {
        it("should GET user by id", async () => {
            const response = await api.request("GET", `guardian/groups/${groups[0].name}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toStrictEqual(groups[0]);
        });

        it("should fail to GET a group by id if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "guardian/groups/non-existing"));
        });
    });

    describe("GET /guardian/groups/{id}/users", () => {
        it("should GET group's users", async () => {
            const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
                Container.Identifiers.WalletRepository,
                "state",
                "blockchain",
            );
            const publicKey = "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d";
            const user = {
                groups: ["group name1"],
                permissions: [],
            };
            const wallet = walletRepository.findByPublicKey(publicKey);
            wallet.setAttribute("guardian.userPermissions", user);
            walletRepository.getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer).index(wallet);

            const response = await api.request("GET", `guardian/groups/${groups[0].name}/users`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data.length).toBe(1);
            expect(response.data.data[0]).toStrictEqual({ ...user, publicKey });
        });

        it("should fail to GET a group's users if group doesn't exist", async () => {
            api.expectError(await api.request("GET", "guardian/groups/non-existing/users"));
        });
    });
});
