import { Interfaces } from "@arkecosystem/crypto";

import { getNonce } from "./client";

export const buildTransaction = async (
    transactionBuilder,
    payloadData: Record<string, any>,
): Promise<Interfaces.ITransactionData> => {
    transactionBuilder
        .nonce(payloadData.nonce ? payloadData.nonce.toFixed() : await getNonce(payloadData.passphrase))
        .sign(payloadData.passphrase);

    return transactionBuilder.build().toJson();
};
