import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { NFTConnection } from "@protokol/nft-client";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

export const NFTAuctionCancel = async () => {
    // Configure manager and register transaction type
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTAuctionCancelTransaction);

    // Configure our API client
    const client = new NFTConnection("http://nft.protokol.com:4003/api");
    const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

    // Step 1: Retrieve the nonce of the sender wallet
    const senderWallet = await client.api("wallets").get(Identities.Address.fromPassphrase(passphrase));
    const senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);

    // Step 2: Create the transaction
    const transaction = new Builders.NFTAuctionCancelBuilder()
        .NFTAuctionCancelAsset({
            auctionId: "58dc9625ff7190dc3ff2dbf541a2bb2c8a85366f2cbe95d21ec9b8970f41d086",
        })
        .nonce(senderNonce.toFixed())
        .sign(passphrase);

    // Step 3: Broadcast the transaction
    const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });

    // Step 4: Log the response
    console.log(JSON.stringify(broadcastResponse.body.data, null, 4));
};
