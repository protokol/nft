import { Connection } from "@arkecosystem/client";
import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

export const NFTAcceptTrade = async () => {
    // Configure manager and register transaction type
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTAcceptTradeTransaction);

    // Configure our API client
    const client = new Connection("http://nft.protokol.com:4003/api");
    const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

    // Step 1: Retrieve the nonce of the sender wallet
    const senderWallet = await client.api("wallets").get(Identities.Address.fromPassphrase(passphrase));
    const senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);

    // Step 2: Create the transaction
    const transaction = new Builders.NftAcceptTradeBuilder()
        .NFTAcceptTradeAsset({
            auctionId: "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
            bidId: "032383b3f5c541c117c3409fdb1545e7b34deb0f6922ef7a42c40867d24402d8",
        })
        .nonce(senderNonce.toFixed())
        .sign(passphrase);

    // Step 3: Broadcast the transaction
    const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });

    // Step 4: Log the response
    console.log(JSON.stringify(broadcastResponse.body.data, null, 4));
};
