import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { NFTBaseTransactionGroup } from "../enums";

export abstract class NFTBaseTransactionBuilder<TBuilder> extends Transactions.TransactionBuilder<
    NFTBaseTransactionBuilder<TBuilder>
> {
    protected constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTBaseTransactionGroup;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }
}
