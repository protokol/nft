import Hapi from "@hapi/hapi";

import * as Assets from "./routes/assets";
import * as Burns from "./routes/burns";
import * as Collections from "./routes/collections";
import * as Configurations from "./routes/configurations";
import * as Transfers from "./routes/transfers";

export = {
	async register(server: Hapi.Server): Promise<void> {
		Configurations.register(server);
		Collections.register(server);
		Assets.register(server);
		Transfers.register(server);
		Burns.register(server);
	},
	name: "NFT Base Api",
	version: "1.0.0",
};
