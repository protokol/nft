import Hapi from "@hapi/hapi";

import * as Payload from "./routes/payload";

export = {
    async register(server: Hapi.Server): Promise<void> {
        Payload.register(server);
    },
    name: "NFT GENERATOR API",
    version: "0.0.1",
};
