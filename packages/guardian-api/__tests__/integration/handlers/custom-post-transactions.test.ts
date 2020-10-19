import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers, passphrases } from "@arkecosystem/core-test-framework";
import { Builders } from "@protokol/guardian-crypto";
import { Interfaces } from "@protokol/guardian-transactions";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
	app = await setUp();
	api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Post transaction", () => {
	it("should return Forbidden if wallet doesn't have permissions to POST transactions", async () => {
		// change permission resolver to reject all transactions
		app.get<any>(Interfaces.Identifiers.PermissionsResolver).resolve = () => Promise.resolve(false);

		const actual = new Builders.GuardianUserPermissionsBuilder()
			.GuardianUserPermissions({
				publicKey: "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
			})
			.nonce("3")
			.sign(passphrases[0])
			.build();

		const response = await api.request("POST", "transactions", {
			transactions: [actual.data],
		});

		// response should be 403 (without custom error handler is 500)
		expect(response.data.statusCode).toBe(403);
	});
});
