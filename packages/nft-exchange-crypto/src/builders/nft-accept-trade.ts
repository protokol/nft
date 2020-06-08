import { Utils } from "@arkecosystem/crypto";

import { NFTTransactionTypes } from "../enums";
import { NFTAcceptTradeAsset } from "../interfaces";
import { NFTAcceptTradeTransaction } from "../transactions";
import { NFTExchangeTransactionBuilder } from "./nft-exchange-builder";

export class NftAcceptTradeBuilder extends NFTExchangeTransactionBuilder<NftAcceptTradeBuilder> {
    public constructor() {
        super();
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

    protected instance(): NftAcceptTradeBuilder {
        return this;
    }
}
