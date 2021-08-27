import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

export abstract class AbstractNFTTransactionBuilder<
	TBuilder extends Transactions.TransactionBuilder<TBuilder>,
> extends Transactions.TransactionBuilder<TBuilder> {
	protected constructor() {
		super();
		this.data.amount = Utils.BigNumber.ZERO;
	}

	public override getStruct(): Interfaces.ITransactionData {
		const struct: Interfaces.ITransactionData = super.getStruct();
		struct.amount = this.data.amount;
		struct.asset = this.data.asset;
		struct.vendorField = this.data.vendorField;

		return struct;
	}
}
