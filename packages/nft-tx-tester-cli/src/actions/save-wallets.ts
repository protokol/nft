import { App } from "../types";
import { Action } from "../types/propmpt";

export const action: Action = {
    description: "Save wallets",
    handler: async (app: App, data) => {
        const wallets = app.walletRepository.getWallets();

        await app.filesystem.saveWalletsSnapshot(app.config.network, wallets);

        console.log("Wallets saved");
    },
};
