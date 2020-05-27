import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTExchangeTransactionsTypeGroup, NFTTransactionTypes } from "../enums";
import { NFTAcceptTradeAsset } from "../interfaces";
import { NFTAcceptTradeTransaction } from "../transactions";

export class NftAcceptTradeBuilder extends Transactions.TransactionBuilder<NftAcceptTradeBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTExchangeTransactionsTypeGroup;
        this.data.type = NFTTransactionTypes.NFTAcceptTrade;
        this.data.fee = NFTAcceptTradeTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { nftAcceptTrade: {} };
    }

    public NFTAcceptTradeAsset(nftAcceptTrade: NFTAcceptTradeAsset): NftAcceptTradeBuilder {
        if (this.data.asset && this.data.asset.nftAcceptTrade) {
            this.data.asset.nftAcceptTrade = {
                ...nftAcceptTrade,
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

    protected instance(): NftAcceptTradeBuilder {
        return this;
    }
}
