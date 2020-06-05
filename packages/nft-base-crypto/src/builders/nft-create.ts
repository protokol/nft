import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NFTBaseTransactionTypes } from "../enums";
import { NFTTokenAsset } from "../interfaces";
import { NFTBuilderInit } from "./helpers";

export class NFTCreateBuilder extends Transactions.TransactionBuilder<NFTCreateBuilder> {
    constructor() {
        super();
        NFTBuilderInit(this, NFTBaseTransactionTypes.NFTCreate, { nftToken: {} } );
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
