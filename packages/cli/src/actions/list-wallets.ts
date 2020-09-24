import { Action, App } from "../types";

export const action: Action = {
	description: "List wallets",
	handler: async (app: App) => {
		console.log("Wallets: \n", app.walletRepository.getWallets());
	},
};
