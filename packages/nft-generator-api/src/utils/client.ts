import { Utils } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";

export const getNonce = async (passphrase: string) => {
    // this is for now - as a local generator // refactor this when moving into rpc
    const wallet = await Utils.http.get(
        `http://127.0.0.1:4003/api/wallets/${Identities.Address.fromPassphrase(passphrase)}`,
    );
    return Utils.BigNumber.make(wallet.data.data.nonce).plus(1).toFixed();
};

export const postPayload = async (payload) => {
    // this is for now - as a local generator // refactor this when moving into rpc
    return await Utils.http.post("http://127.0.0.1:4003/api/transactions", {
        body: {
            // @ts-ignore - object can't be assigned to primitive
            transactions: [payload],
        },
        headers: { "Content-Type": "application/json" },
    });
};

export const buildResponse = async (payload: object, applyTransaction: boolean) => {
    return {
        data: {
            payloadPostResult: applyTransaction ? (await postPayload(payload)).data : undefined,
            payload: payload,
        },
    };
};
