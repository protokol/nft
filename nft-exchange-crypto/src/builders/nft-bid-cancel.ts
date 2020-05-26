import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTExchangeTransactionsTypeGroup, NFTTransactionTypes } from "../enums";
import { NFTBidCancelAsset } from "../interfaces";
import { NFTBidCancelTransaction } from "../transactions";

export class NFTBidCancelBuilder extends Transactions.TransactionBuilder<NFTBidCancelBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTExchangeTransactionsTypeGroup;
        this.data.type = NFTTransactionTypes.NFTBidCancel;
        this.data.fee = NFTBidCancelTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { nftBidCancel: {} };
    }

    public NFTBidCancelAsset(nftBidCancel: NFTBidCancelAsset): NFTBidCancelBuilder {
        if (this.data.asset && this.data.asset.nftBidCancel) {
            this.data.asset.nftBidCancel = {
                ...nftBidCancel,
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

    protected instance(): NFTBidCancelBuilder {
        return this;
    }
}
