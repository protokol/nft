import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTExchangeTransactionsTypeGroup, NFTTransactionTypes } from "../enums";
import { NFTAuctionCancel } from "../interfaces";
import { NFTAuctionCancelTransaction } from "../transactions";

export class NFTAuctionCancelBuilder extends Transactions.TransactionBuilder<NFTAuctionCancelBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTExchangeTransactionsTypeGroup;
        this.data.type = NFTTransactionTypes.NFTAuctionCancel;
        this.data.fee = NFTAuctionCancelTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { nftAuctionCancel: {} };
    }

    public NFTAuctionCancelAsset(nftAuctionCancel: NFTAuctionCancel): NFTAuctionCancelBuilder {
        if (this.data.asset && this.data.asset.nftAuctionCancel) {
            this.data.asset.nftAuctionCancel = {
                ...nftAuctionCancel,
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

    protected instance(): NFTAuctionCancelBuilder {
        return this;
    }
}
