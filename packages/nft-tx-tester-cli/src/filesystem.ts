import { outputJson, pathExists, readJson } from "fs-extra";
import { join } from "path";

import { Wallet } from "./types";

const configPath = join(__dirname, `config`);

export class Filesystem {
    async loadWallets(preset: string): Promise<Wallet[]> {
        let path = join(configPath, `${preset}/wallets-snapshot.json`);

        if (!(await pathExists(path))) {
            path = join(configPath, `${preset}/wallets.json`);
        }

        return await readJson(path);
    }

    async saveWalletsSnapshot(preset: string, wallets: Wallet[]) {
        const path = join(configPath, `${preset}/wallets-snapshot.json`);

        await outputJson(path, wallets);
    }
}
