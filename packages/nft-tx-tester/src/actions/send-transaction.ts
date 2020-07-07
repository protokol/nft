import { Builder } from "../builder";
import { builders } from "../builders";
import { Action, App } from "../types";

const sendTransaction = async (app: App, type: number, quantity: number, data: any) => {
    try {
        const splitInput = data.split(" ");
        //let [type, quantity] = splitInput;

        //type = +type;
        //quantity = quantity ? +quantity : 1;

        const builder = new Builder(app);

        const { transactions, walletChanges } = await builder.buildTransaction(
            type,
            quantity ? +quantity : 1,
            splitInput,
        );

        const response = await app.client.postTransaction(transactions);

        app.walletRepository.handleWalletChanges(walletChanges, response);
    } catch (ex) {
        console.log(ex.message);
    }
};

const selectTransactionQuestion = () => {
    let question = "\nSelect transaction:";

    for (const key of Object.keys(builders)) {
        question += `\n [${key}] - ${builders[key].name}`;
    }

    question += "\n";

    return question;
};

export const action: Action = {
    description: "Send transaction",
    handler: async (app, data) => {
        await app.prompt.prompt(selectTransactionQuestion(), sendTransaction);
    },
    sendTransaction,
};
