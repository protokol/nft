import Hapi from "@hapi/hapi";

import * as Auctions from "./routes/auctions";
import * as Bids from "./routes/bids";
import * as Configurations from "./routes/configurations";
import * as Trades from "./routes/trades";

export = {
	async register(server: Hapi.Server): Promise<void> {
		Configurations.register(server);
		Auctions.register(server);
		Bids.register(server);
		Trades.register(server);
	},
	name: "NFT Exchange Api",
	version: "1.0.0",
};
