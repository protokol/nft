import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTExchangeTransactionsTypeGroup, NFTTransactionTypes } from "../enums";
import { NFTBidAsset } from "../interfaces";
import { NFTBidTransaction } from "../transactions";

export class NFTBidBuilder extends Transactions.TransactionBuilder<NFTBidBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTExchangeTransactionsTypeGroup;
        this.data.type = NFTTransactionTypes.NFTBid;
        this.data.fee = NFTBidTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { nftBid: {} };
    }

    public NFTBidAsset(nftBid: NFTBidAsset): NFTBidBuilder {
        if (this.data.asset && this.data.asset.nftBid) {
            this.data.asset.nftBid = {
                ...nftBid,
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

    protected instance(): NFTBidBuilder {
        return this;
    }
}
