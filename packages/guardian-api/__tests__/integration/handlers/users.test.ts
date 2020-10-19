import "@arkecosystem/core-test-framework/dist/matchers";

import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework";
import { Enums } from "@protokol/guardian-crypto";
import { Indexers, Interfaces } from "@protokol/guardian-transactions";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

const users = [
	{
		groups: ["group name1"],
		allow: [{ transactionType: 9000, transactionTypeGroup: 0 }],
		deny: [],
		publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
	},
	{
		groups: ["group name2"],
		allow: [],
		deny: [],
		publicKey: "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
	},
];

const groups = {
	"group name1": {
		name: "group name1",
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
	},
	"group name2": {
		name: "group name2",
		priority: 2,
		default: false,
		active: true,
		deny: [{ transactionType: 9000, transactionTypeGroup: 0 }],
		allow: [],
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
		Contracts.Kernel.CacheStore<Interfaces.IGroupPermissions["name"], Interfaces.IGroupPermissions>
	>(Container.Identifiers.CacheService, "cache", "@protokol/guardian-transactions");

	// set mock users and groups
	for (let i = 0; i < users.length; i++) {
		const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(users[i].publicKey);
		wallet.setAttribute("guardian.userPermissions", users[i]);
		walletRepository.getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer).index(wallet);
		await groupsPermissionsCache.put(users[i].groups[0], groups[users[i].groups[0]], -1);
	}
});

afterAll(async () => await tearDown());

describe("API - Users", () => {
	describe("GET /guardian/users", () => {
		it("should GET get all users", async () => {
			const response = await api.request("GET", "guardian/users");

			expect(response).toBeSuccessfulResponse();
			api.expectPaginator(response);
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
