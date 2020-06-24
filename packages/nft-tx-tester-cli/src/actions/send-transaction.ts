import { Builder } from "../builder";
import { transactions } from "../builders";
import { App } from "../types";
import { Action } from "../types/propmpt";

const sendTransaction = async (app: App, data: any) => {
    try {
        let [type, quantity, sender, recipient] = data.split(" ");

        type = +type;
        quantity = quantity ? +quantity : 1;

        const builder = new Builder(app);

        const { transactions, walletChanges } = await builder.buildTransaction(type, quantity, sender, recipient);

        const response = await app.client.postTransaction(transactions);

        app.walletRepository.handleWalletChanges(walletChanges, response);
    } catch (ex) {
        console.log(ex.message);
    }
};

const selectTransactionQuestion = () => {
    let question = "\nSelect transaction:";

    for (const key of Object.keys(transactions)) {
        question += `\n [${key}] - ${transactions[key]}`;
    }

    question += "\n";

    return question;
};

export const action: Action = {
    description: "Send transaction",
    handler: async (app, data) => {
        await app.prompt.prompt(selectTransactionQuestion(), sendTransaction);
    },
};
