import { Command } from "@oclif/command";

import { listWallets } from "../actions";
import { Client } from "../client";
import { config } from "../config/config";
import { Filesystem } from "../filesystem";
import { App } from "../types";
import { WalletRepository } from "../wallets-repository";

export default class ListWallets extends Command {
    public static description = listWallets.description;

    public async run() {
        const filesystem = new Filesystem();

        const app: App = {
            config,
            client: new Client(config),
            walletRepository: new WalletRepository(await filesystem.loadWallets(config.network)),
            filesystem: filesystem,
            nonces: {},
        };

        await listWallets.handler(app);
    }
}
