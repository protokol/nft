import "jest-extended";

import { Application } from "@arkecosystem/core-kernel";
import latestVersion from "latest-version";

import { ConfigurationController } from "../../../src/controllers/configurations";
import { initApp, ItemResponse } from "../__support__";

let app: Application;
let configurationsController: ConfigurationController;

beforeEach(() => {
	app = initApp();
	configurationsController = app.resolve<ConfigurationController>(ConfigurationController);
});

describe("Test configurations controller", () => {
	it("index - return package name and version", async () => {
		const response = (await configurationsController.index(undefined, undefined)) as ItemResponse;
		expect(response.data).toStrictEqual({
			package: {
				name: require("../../../package.json").name,
				currentVersion: require("../../../package.json").version,
				//latestVersion: await latestVersion(require("../../../package.json").name),
			},
		});
	});
});
