import { AbstractNFTTransactionBuilder } from "@protokol/core-nft-crypto";

import { NFTTransactionTypes } from "../enums";
import { NFTAuctionAsset } from "../interfaces";
import { NFTAuctionTransaction } from "../transactions";

export class NFTAuctionBuilder extends AbstractNFTTransactionBuilder<NFTAuctionBuilder> {
    public constructor() {
        super();
        this.data.type = NFTTransactionTypes.NFTAuction;
        this.data.fee = NFTAuctionTransaction.staticFee();
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

    protected instance(): NFTAuctionBuilder {
        return this;
    }
}
