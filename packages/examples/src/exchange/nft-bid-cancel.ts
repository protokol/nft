import { ProtokolConnection } from "@protokol/client";
import { ARKCrypto, Builders, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

export const NFTBidCancel = async () => {
	// Configure manager and register transaction type
	ARKCrypto.Managers.configManager.setFromPreset("testnet");
	ARKCrypto.Managers.configManager.setHeight(2);
	ARKCrypto.Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTBidCancelTransaction);

	// Configure our API client
	const client = new ProtokolConnection("http://nft.protokol.com:4003/api");
	const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

	// Step 1: Retrieve the nonce of the sender wallet
	const senderWallet = await client.api("wallets").get(ARKCrypto.Identities.Address.fromPassphrase(passphrase));
	const senderNonce = ARKCrypto.Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);

	// Step 2: Create the transaction
	const transaction = new Builders.NFTBidCancelBuilder()
		.NFTBidCancelAsset({
			bidId: "c67beef6edc35f81334e8bf825dbc735e8d579f8297509d74980756b9b9ff8fe",
		})
		.nonce(senderNonce.toFixed())
		.sign(passphrase);

	// Step 3: Broadcast the transaction
	const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });

	// Step 4: Log the response
	console.log(JSON.stringify(broadcastResponse.body.data, null, 4));
};
