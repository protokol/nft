import { Interfaces, Transactions } from "@arkecosystem/crypto";
import {  NFTBaseTransactionTypes } from "../enums";
import { NFTTransferAsset } from "../interfaces";
import { NFTBuilderInit } from "./helpers";

export class NFTTransferBuilder extends Transactions.TransactionBuilder<NFTTransferBuilder> {
    constructor() {
        super();
        NFTBuilderInit(this,NFTBaseTransactionTypes.NFTTransfer,{ nftTransfer: {} });
    }

    public NFTTransferAsset(nftTransfer: NFTTransferAsset): NFTTransferBuilder {
        if (this.data.asset && this.data.asset.nftTransfer) {
            this.data.asset.nftTransfer = {
                ...nftTransfer,
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

    protected instance(): NFTTransferBuilder {
        return this;
    }
}
