import { AbstractNFTTransactionBuilder } from "@protokol/core-nft-crypto";

import { NFTTransactionTypes } from "../enums";
import { NFTBidAsset } from "../interfaces";
import { NFTBidTransaction } from "../transactions";

export class NFTBidBuilder extends AbstractNFTTransactionBuilder<NFTBidBuilder> {
    public constructor() {
        super();
        this.data.type = NFTTransactionTypes.NFTBid;
        this.data.fee = NFTBidTransaction.staticFee();
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
