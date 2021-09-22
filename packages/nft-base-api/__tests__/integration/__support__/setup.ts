import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { Managers } from "@arkecosystem/crypto";
import { EventEmitter } from "events";

EventEmitter.prototype.constructor = Object.prototype.constructor;

const sandbox: Sandbox = new Sandbox();

export const setUp = async () => {
	jest.setTimeout(60000);

	process.env.DISABLE_P2P_SERVER = "true"; // no need for p2p socket server to run
	process.env.CORE_RESET_DATABASE = "1";

	sandbox.withCoreOptions({
		flags: {
			token: "ark",
			network: "unitnet",
			env: "test",
		},
		peers: {
			list: [{ ip: "127.0.0.1", port: 4000 }], // need some peers defined for the app to run
		},
		app: require("./app.json"),
	});
	await sandbox.boot(async ({ app }) => {
		await app.bootstrap({
			flags: {
				token: "ark",
				network: "unitnet",
				env: "test",
				processType: "core",
			},
		});

		Managers.configManager.getMilestone().aip11 = false;
		Managers.configManager.getMilestone().htlcEnabled = false;

		await app.boot();

		Managers.configManager.getMilestone().aip11 = true;
		Managers.configManager.getMilestone().htlcEnabled = true;

		await AppUtils.sleep(1000); // give some more time for api server to be up
	});

	return sandbox.app;
};

export const tearDown = async () => sandbox.dispose();
