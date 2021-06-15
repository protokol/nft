import Hapi from "@hapi/hapi";

import * as Assets from "./routes/assets";
import * as Configurations from "./routes/configurations";

export = {
	async register(server: Hapi.Server): Promise<void> {
		Configurations.register(server);
		Assets.register(server);
	},
	name: "NFT Indexer Api",
	version: "1.0.0",
};
