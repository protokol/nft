import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { NFTExchangeTransactionsTypeGroup } from "../enums";

export abstract class NFTExchangeTransactionBuilder<TBuilder> extends Transactions.TransactionBuilder<
    NFTExchangeTransactionBuilder<TBuilder>
> {
    protected constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTExchangeTransactionsTypeGroup;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }
}
