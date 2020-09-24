import { Builder } from "../builder";
import { Action, App } from "../types";

const sendTransaction = async (app: App, type: number, quantity: number) => {
	try {
		const builder = new Builder(app);

		const { transactions, walletChanges } = await builder.buildTransaction(type, quantity ? +quantity : 1);

		const response = await app.client.postTransaction(transactions);

		app.walletRepository.handleWalletChanges(walletChanges, response);
	} catch (ex) {
		console.log(ex.message);
	}
};

export const action: Action = {
	description: "Send transaction",
	handler: async (app, type, quantity) => {
		await sendTransaction(app, type!, quantity!);
	},
};
