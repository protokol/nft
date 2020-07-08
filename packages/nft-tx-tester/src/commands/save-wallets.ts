import { Command } from "@oclif/command";

import { saveWallets } from "../actions";
import { Client } from "../client";
import { config } from "../config/config";
import { Filesystem } from "../filesystem";
import { App } from "../types";
import { WalletRepository } from "../wallets-repository";

export default class SaveWallets extends Command {
    public static description = saveWallets.description;

    public async run() {
        const filesystem = new Filesystem();

        const app: App = {
            config,
            client: new Client(config),
            walletRepository: new WalletRepository(await filesystem.loadWallets(config.network)),
            filesystem: filesystem,
            nonces: {},
        };

        await saveWallets.handler(app);
    }
}
