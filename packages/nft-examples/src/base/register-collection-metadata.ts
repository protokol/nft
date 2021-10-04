import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { ProtokolConnection } from "@protokol/client";
import { Builders, Transactions as NFTBaseTransactions } from "@protokol/nft-base-crypto";

export const RegisterCollectionMetadata = async (): Promise<void> => {
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
			metadata: {
				collectionId: "8643026a0997dc9fe74ce4aa11f522ecff651fa72ecf0127a0665fd52535bc1b",
				attributes: {
					name: "AREX ALPHA",
					description:
						"THE AREX ALPHA IS THE NEXT EVOLUTIONARY STEP IN THE AREX HANDGUN FAMILY. IT IS A DIRECT DESCENDANT OF THE AREX ZERO 1 AND HAS INHERITED ITS TOUGHNESS AND RELIABILITY. LISTENING TO THE PRACTICAL SHOOTERS, AREX DESIGNED AND DEVELOPED A PISTOL THAT EXCELS IN COMPETITIVE PRACTICAL SHOOTING AS WELL AS IN TACTICAL SCENARIOS. WITH THE ELUSIVE AND ALL IMPORTANT SHOOTABILITY BEING AREXS PRIMARY GOAL, A STEEL FRAME WAS USED IN PLACE OF AN ALUMINUM ONE. A REENGINEERED GRIP RESULTS IN SHORTER TRIGGER REACH AND NOTABLY HIGHER HAND POSITION. AN UNDERCUT TRIGGER GUARD AND EXTENDED BEAVERTAIL COMPLETE THE ERGONOMIC TRANSFORMATION. THE LONG SLIDE HOUSES A FIVE INCH BARREL, PROVIDING A LONGER LINE OF SIGHT FOR FASTER AND MORE ACCURATE SHOTS. THE SLIDE HAS BEEN LIGHTENED SIGNIFICANTLY UTILIZING LIGHTENING CUTS TO ACCOMPLISH FASTER CYCLING.",
					serialNumber: "6789897676898976",
					caliber: "9 x 19 mm",
					length: "226 mm // 8.9 inches",
					height: "155 mm // 6.1 inches",
					width: "42 mm // 1.65 inches",
					barrelLength: "127 mm // 5.0 inches",
					weight: "1202 g // 42.3 oz",
					frameColors: "Nitrocarburized steel // Graphite black color // Blue // Red",
					slide: "Nitrocarburized steel // Graphite black color",
					slights: "Fiber optic front and fully adjustable black rear sight",
					ipfsImageHash: "QmPbvs8G1jVaH6iHBUC2W1YnwY9AhzD98ydVqnhG9KMej1",
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

RegisterCollectionMetadata()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
