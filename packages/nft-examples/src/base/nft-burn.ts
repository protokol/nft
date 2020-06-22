import { Connection } from "@arkecosystem/client";
import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

export const NFTBurn = async () => {
    // Configure manager and register transaction type
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTBurnTransaction);

    // Configure our API client
    const client = new Connection("http://nft.protokol.com:4003/api");
    const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

    // Step 1: Retrieve the nonce of the sender wallet
    const senderWallet = await client.api("wallets").get(Identities.Address.fromPassphrase(passphrase));
    const senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);

    // Step 2: Create the transaction
    const transaction = new Builders.NFTBurnBuilder()
        .NFTBurnAsset({
            nftId: "6f252f11b119e00a5364d37670623d1b6be562f577984c819237ca4668e2897e",
        })
        .nonce(senderNonce.toFixed())
        .sign(passphrase);

    // Step 3: Broadcast the transaction
    const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });

    // Step 4: Log the response
    console.log(JSON.stringify(broadcastResponse.body.data, null, 4));
};
