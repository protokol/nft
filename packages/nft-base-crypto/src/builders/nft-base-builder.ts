import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTBaseTransactionGroup, NFTBaseTransactionVersion } from "../enums";

export abstract class NFTBaseTransactionBuilder<TBuilder> extends Transactions.TransactionBuilder<
    NFTBaseTransactionBuilder<TBuilder>
> {
    protected constructor() {
        super();
        this.data.version = NFTBaseTransactionVersion;
        this.data.typeGroup = NFTBaseTransactionGroup;
        this.data.amount = Utils.BigNumber.ZERO;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }
}
