import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTExchangeTransactionsTypeGroup, NFTExchangeTransactionVersion } from "../enums";

export abstract class NFTExchangeTransactionBuilder<TBuilder> extends Transactions.TransactionBuilder<
    NFTExchangeTransactionBuilder<TBuilder>
> {
    protected constructor() {
        super();
        this.data.version = NFTExchangeTransactionVersion;
        this.data.typeGroup = NFTExchangeTransactionsTypeGroup;
        this.data.amount = Utils.BigNumber.ZERO;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }
}
