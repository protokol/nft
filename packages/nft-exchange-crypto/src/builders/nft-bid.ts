import { Utils } from "@arkecosystem/crypto";

import { NFTTransactionTypes } from "../enums";
import { NFTBidAsset } from "../interfaces";
import { NFTBidTransaction } from "../transactions";
import { NFTExchangeTransactionBuilder } from "./nft-exchange-builder";

export class NFTBidBuilder extends NFTExchangeTransactionBuilder<NFTBidBuilder> {
    public constructor() {
        super();
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

    protected instance(): NFTBidBuilder {
        return this;
    }
}
