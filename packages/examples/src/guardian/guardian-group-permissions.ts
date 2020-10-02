import { GuardianConnection } from "@protokol/client";
import { ARKCrypto, Builders, Transactions as GuardianTransactions } from "@protokol/guardian-crypto";

export const guardianGroupPermission = async () => {
    // Configure manager and register transaction type
    ARKCrypto.Managers.configManager.setFromPreset("testnet");
    ARKCrypto.Managers.configManager.setHeight(2);
    ARKCrypto.Transactions.TransactionRegistry.registerTransactionType(
        GuardianTransactions.GuardianGroupPermissionsTransaction,
    );

    // Configure our API client
    const client = new GuardianConnection("http://nft.protokol.com:4003/api");
    const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

    // Step 1: Retrieve the nonce of the sender wallet
    const senderWallet = await client.api("wallets").get(ARKCrypto.Identities.Address.fromPassphrase(passphrase));
    const senderNonce = ARKCrypto.Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);

    // Step 2: Create the transaction
    const transaction = new Builders.GuardianGroupPermissionsBuilder()
        .GuardianGroupPermissions({
            name: "Test Guardian Permission Group",
            allow: [{ transactionType: 1, transactionTypeGroup: 1 }],
            priority: 1,
            active: true,
            default: false,
        })
        .nonce(senderNonce.toFixed())
        .sign(passphrase);

    // Step 3: Broadcast the transaction
    const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });

    // Step 4: Log the response
    console.log(JSON.stringify(broadcastResponse.body.data, null, 4));
};
