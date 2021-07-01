import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework";
import latestVersion from "latest-version";

import { setUp, tearDown } from "../__support__/";

jest.setTimeout(30000);

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
	app = await setUp();
	api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Configurations", () => {
	describe("GET /nft/indexer/configurations", () => {
		it("should GET nft-indexer-api configurations data", async () => {
			const response = await api.request("GET", "nft/indexer/configurations");
			expect(response).toBeSuccessfulResponse();

			expect(response.data.data.package.name).toStrictEqual(require("../../../package.json").name);
			expect(response.data.data.package.currentVersion).toStrictEqual(require("../../../package.json").version);
			// expect(response.data.data.package.latestVersion).toStrictEqual(
			// 	await latestVersion(require("../../../package.json").name),
			// );
		});
	});
});
