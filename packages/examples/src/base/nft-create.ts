import { ProtokolConnection } from "@protokol/client";
import { ARKCrypto, Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

export const NFTCreate = async () => {
	// Configure manager and register transaction type
	ARKCrypto.Managers.configManager.setFromPreset("testnet");
	ARKCrypto.Managers.configManager.setHeight(2);
	ARKCrypto.Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTCreateTransaction);

	// Configure our API client
	const client = new ProtokolConnection("http://nft.protokol.com:4003/api");
	const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

	// Step 1: Retrieve the nonce of the sender wallet
	const senderWallet = await client.api("wallets").get(ARKCrypto.Identities.Address.fromPassphrase(passphrase));
	const senderNonce = ARKCrypto.Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);

	// Step 2: Create the transaction
	const transaction = new Builders.NFTCreateBuilder()
		.NFTCreateToken({
			collectionId: "c23b4a9e07329861422df43631d7aa72153cabcca3067941b94a69016ae8723b",
			attributes: {
				name: "Antonio Caracciolo",
				pac: 90,
				sho: 90,
				pas: 90,
				dri: 90,
				def: 90,
				phy: 90,
			},
		})
		.nonce(senderNonce.toFixed())
		.sign(passphrase);

	// Step 3: Broadcast the transaction
	const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });

	// Step 4: Log the response
	console.log(JSON.stringify(broadcastResponse.body.data, null, 4));
};
