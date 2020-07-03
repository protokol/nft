import { Action, App } from "../types";

export const action: Action = {
    description: "List wallets",
    handler: async (app: App, data: string) => {
        console.log("Wallets: \n", app.walletRepository.getWallets());
    },
};
