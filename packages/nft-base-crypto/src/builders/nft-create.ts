import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTBaseTransactionGroup, NFTBaseTransactionTypes } from "../enums";
import { NFTTokenAsset } from "../interfaces";
import { NFTCreateTransaction } from "../transactions";

export class NFTCreateBuilder extends Transactions.TransactionBuilder<NFTCreateBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTBaseTransactionGroup;
        this.data.type = NFTBaseTransactionTypes.NFTCreate;
        this.data.fee = NFTCreateTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { nftToken: {} };
    }

    public NFTCreateToken(nftToken: NFTTokenAsset): NFTCreateBuilder {
        if (this.data.asset && this.data.asset.nftToken) {
            this.data.asset.nftToken = {
                ...nftToken,
            };
        }
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): NFTCreateBuilder {
        return this;
    }
}
