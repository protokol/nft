import Hapi from "@hapi/hapi";

import * as Configurations from "./routes/configurations";
import * as Groups from "./routes/groups";
import * as Users from "./routes/users";

export = {
	async register(server: Hapi.Server): Promise<void> {
		Configurations.register(server);
		Users.register(server);
		Groups.register(server);
	},
	name: "Guardian Api",
	version: "1.0.0",
};
