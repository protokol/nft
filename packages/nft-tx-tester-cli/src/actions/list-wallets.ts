import { App } from "../types";
import { Action } from "../types/propmpt";

export const action: Action = {
    description: "List wallets",
    handler: async (app: App, data: string) => {
        console.log("Wallets: \n", app.walletRepository.getWallets());
    },
};
