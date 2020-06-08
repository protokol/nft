import { Utils } from "@arkecosystem/crypto";

import { NFTTransactionTypes } from "../enums";
import { NFTBidCancelAsset } from "../interfaces";
import { NFTBidCancelTransaction } from "../transactions";
import { NFTExchangeTransactionBuilder } from "./nft-exchange-builder";

export class NFTBidCancelBuilder extends NFTExchangeTransactionBuilder<NFTBidCancelBuilder> {
    public constructor() {
        super();
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

    protected instance(): NFTBidCancelBuilder {
        return this;
    }
}
