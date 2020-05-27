import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTExchangeTransactionsTypeGroup, NFTTransactionTypes } from "../enums";
import { NFTAuctionAsset } from "../interfaces";
import { NFTAuctionTransaction } from "../transactions";

export class NFTAuctionBuilder extends Transactions.TransactionBuilder<NFTAuctionBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTExchangeTransactionsTypeGroup;
        this.data.type = NFTTransactionTypes.NFTAuction;
        this.data.fee = NFTAuctionTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { nftAuction: {} };
    }

    public NFTAuctionAsset(nftAuction: NFTAuctionAsset): NFTAuctionBuilder {
        if (this.data.asset && this.data.asset.nftAuction) {
            this.data.asset.nftAuction = {
                ...nftAuction,
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

    protected instance(): NFTAuctionBuilder {
        return this;
    }
}
