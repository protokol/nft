import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Enums, Transactions as GuardianTransactions } from "@protokol/guardian-crypto";
import { Indexers, Interfaces } from "@protokol/guardian-transactions";

import {
	buildWallet,
	CollectionResponse,
	ErrorResponse,
	initApp,
	ItemResponse,
	PaginatedResponse,
} from "../__support__";
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
		allow: [
			{
				transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
				transactionTypeGroup: Enums.GuardianTransactionGroup,
			},
		],
		deny: [],
	},
	{
		name: "group name2",
		priority: 2,
		default: true,
		active: false,
		allow: [],
		deny: [{ transactionType: 9000, transactionTypeGroup: 0 }],
	},
];

beforeEach(async () => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);

	app = initApp();

	walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

	groupController = app.resolve<GroupsController>(GroupsController);

	const groupsPermissionsCache = app.get<
		Contracts.Kernel.CacheStore<Interfaces.IGroupPermissions["name"], Interfaces.IGroupPermissions>
	>(Container.Identifiers.CacheService);

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
	it("index - return all groups", async () => {
		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				orderBy: [],
			},
		};

		const response = (await groupController.index(request, undefined)) as PaginatedResponse;

		expect(response.totalCount).toBe(groups.length);
		expect(response.results.length).toBe(groups.length);
		expect(response.results[0]).toStrictEqual(groups[0]);
	});

	it("index - return all groups that matches search query - priority", async () => {
		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				orderBy: [],
				priority: groups[1].priority,
			},
		};

		const response = (await groupController.index(request, undefined)) as PaginatedResponse;

		expect(response.totalCount).toBe(1);
		expect(response.results.length).toBe(1);
		expect(response.results[0]).toStrictEqual(groups[1]);
	});

	it("index - return all groups that matches search query - default", async () => {
		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				orderBy: [],
				default: true,
			},
		};

		const response = (await groupController.index(request, undefined)) as PaginatedResponse;

		expect(response.totalCount).toBe(1);
		expect(response.results.length).toBe(1);
		expect(response.results[0]).toStrictEqual(groups[1]);
	});

	it("index - return all groups that matches search query - active", async () => {
		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				orderBy: [],
				active: false,
			},
		};

		const response = (await groupController.index(request, undefined)) as PaginatedResponse;

		expect(response.totalCount).toBe(1);
		expect(response.results.length).toBe(1);
		expect(response.results[0]).toStrictEqual(groups[1]);
	});

	it("index - return all groups that matches search query - name", async () => {
		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				orderBy: [],
				name: "name2%",
			},
		};

		const response = (await groupController.index(request, undefined)) as PaginatedResponse;

		expect(response.totalCount).toBe(1);
		expect(response.results.length).toBe(1);
		expect(response.results[0]).toStrictEqual(groups[1]);
	});

	it("index - return all groups that matches search query - case insensitive name", async () => {
		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				orderBy: [],
				name: "NAME%",
			},
		};

		const response = (await groupController.index(request, undefined)) as PaginatedResponse;

		expect(response.totalCount).toBe(groups.length);
		expect(response.results.length).toBe(groups.length);
		expect(response.results[0]).toStrictEqual(groups[0]);
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
			allow: [],
			deny: [],
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
