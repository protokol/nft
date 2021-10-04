import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { ProtokolConnection } from "@protokol/client";
import { Builders, Transactions as NFTBaseTransactions } from "@protokol/nft-base-crypto";

export const RegisterCollection = async (): Promise<void> => {
	// Configure our API client
	const client = new ProtokolConnection("http://localhost:4003/api");
	const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

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
	Transactions.TransactionRegistry.registerTransactionType(NFTBaseTransactions.NFTRegisterCollectionTransaction);

	// Step 1: Retrieve the nonce of the sender wallet
	const senderWallet = await client.api("wallets").get(Identities.Address.fromPassphrase(passphrase));
	const senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);

	// Step 2: Create the transaction
	const transaction = new Builders.NFTRegisterCollectionBuilder()
		.NFTRegisterCollectionAsset({
			name: "AREX Defense Handguns",
			description: "AREX weapons sales",
			maximumSupply: 1000,
			jsonSchema: {
				type: "object",
				additionalProperties: false,
				required: [
					"name",
					"description",
					"serialNumber",
					"caliber",
					"length",
					"height",
					"width",
					"barrelLength",
				],
				properties: {
					name: {
						type: "string",
						maxLength: 120,
						minLength: 1,
					},
					description: {
						type: "string",
						maxLength: 3000,
						minLength: 1,
					},
					serialNumber: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					caliber: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					length: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					height: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					width: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					barrelLength: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					weight: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					weightWithMag: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					frameColors: {
						type: "string",
						maxLength: 255,
						minLength: 1,
					},
					slide: {
						type: "string",
						maxLength: 255,
						minLength: 1,
					},
					slights: {
						type: "string",
						maxLength: 255,
						minLength: 1,
					},
					frame: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					firingPinSafety: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					triggerSafety: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					ambidextrousManualSafety: {
						type: "string",
						maxLength: 40,
						minLength: 1,
					},
					ipfsImageHash: {
						type: "string",
						maxLength: 255,
						minLength: 1,
					},
				},
			},
		})
		.nonce(senderNonce.toFixed())
		.sign(passphrase);

	// Step 3: Broadcast the transaction
	const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });

	// Step 4: Log the response
	console.log(JSON.stringify(broadcastResponse.body, null, 4));
};

RegisterCollection()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
