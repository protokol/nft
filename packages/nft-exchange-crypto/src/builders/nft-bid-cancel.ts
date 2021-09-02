import { AbstractNFTTransactionBuilder } from "@protokol/core-nft-crypto";

import { NFTExchangeTransactionsTypeGroup, NFTExchangeTransactionVersion, NFTTransactionTypes } from "../enums";
import { NFTBidCancelAsset } from "../interfaces";
import { NFTBidCancelTransaction } from "../transactions";

export class NFTBidCancelBuilder extends AbstractNFTTransactionBuilder<NFTBidCancelBuilder> {
    public constructor() {
        super();
        this.data.version = NFTExchangeTransactionVersion;
        this.data.typeGroup = NFTExchangeTransactionsTypeGroup;
        this.data.type = NFTTransactionTypes.NFTBidCancel;
        this.data.fee = NFTBidCancelTransaction.staticFee();
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
