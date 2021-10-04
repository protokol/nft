import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { ProtokolConnection } from "@protokol/client";
import { Builders, Transactions as NFTExchangeTransactions } from "@protokol/nft-exchange-crypto";

export const BidCancel = async (): Promise<void> => {
	// Configure our API client
	const client = new ProtokolConnection("http://localhost:4003/api");
	const passphrase = "venue below waste gather spin cruise title still boost mother flash tuna";

	// Configure manager and register transaction type
	const configs = await client.api("node").crypto();
	const {
		body: {
			data: {
				block: { height },
			},
		},
	} = await client.get("blockchain");

	Managers.configManager.setConfig({ ...configs.body.data } as any);
	Managers.configManager.setHeight(height);
	Transactions.TransactionRegistry.registerTransactionType(NFTExchangeTransactions.NFTBidCancelTransaction);

	// Step 1: Retrieve the nonce of the sender wallet
	const senderWallet = await client.api("wallets").get(Identities.Address.fromPassphrase(passphrase));
	const senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);

	// Step 2: Create the transaction
	const transaction = new Builders.NFTBidCancelBuilder()
		.NFTBidCancelAsset({
			bidId: "73f15a9d387035ac8f860e9f6bce63919735f8cf4eee05048ac31b935d3d69a1",
		})
		.nonce(senderNonce.toFixed())
		.sign(passphrase);

	// Step 3: Broadcast the transaction
	const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });

	// Step 4: Log the response
	console.log(JSON.stringify(broadcastResponse.body, null, 4));
};

BidCancel()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
