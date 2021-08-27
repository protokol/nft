import { Errors, Transactions } from "@arkecosystem/crypto";

const { schemas } = Transactions;

export abstract class AbstractNFTTransaction extends Transactions.Transaction {
	public static override getSchema(): Transactions.schemas.TransactionSchema {
		return schemas.extend(schemas.transactionBaseSchema, {
			$id: this.key,
			required: ["asset", "typeGroup"],
			properties: {
				type: { transactionType: this.type },
				typeGroup: { const: this.typeGroup },
				amount: { bignumber: { minimum: 0, maximum: 0 } },
				vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
				asset: {
					...this.getAssetSchema(),
				},
			},
		} as any);
	}

	public static getAssetSchema(): Record<string, any> {
		throw new Errors.NotImplemented();
	}

	public override hasVendorField(): boolean {
		return true;
	}
}
