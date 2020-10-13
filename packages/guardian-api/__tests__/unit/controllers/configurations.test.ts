import "jest-extended";

import { Application } from "@arkecosystem/core-kernel";
import { Generators } from "@arkecosystem/core-test-framework";
import { Managers } from "@arkecosystem/crypto";
import { Defaults as CryptoDefaults } from "@protokol/guardian-crypto";
import { Defaults as TransactionsDefaults } from "@protokol/guardian-transactions";
import latestVersion from "latest-version";

import { initApp, ItemResponse } from "../__support__";
import { ConfigurationController } from "../../../src/controllers/configurations";

let app: Application;

let configurationsController: ConfigurationController;

beforeEach(() => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);

	app = initApp();

	configurationsController = app.resolve<ConfigurationController>(ConfigurationController);
});

describe("Test configurations controller", () => {
	it("index - return package name and version and crypto and transactions default settings", async () => {
		const response = (await configurationsController.index(undefined, undefined)) as ItemResponse;

		expect(response.data).toStrictEqual({
			package: {
				name: require("../../../package.json").name,
				currentVersion: require("../../../package.json").version,
				latestVersion: await latestVersion(require("../../../package.json").name),
			},
			crypto: CryptoDefaults,
			transactions: TransactionsDefaults,
		});
	});
});
