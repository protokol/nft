import { AbstractNFTTransactionBuilder } from "@protokol/core-nft-crypto";

import { NFTTransactionTypes } from "../enums";
import { NFTAuctionCancel } from "../interfaces";
import { NFTAuctionCancelTransaction } from "../transactions";

export class NFTAuctionCancelBuilder extends AbstractNFTTransactionBuilder<NFTAuctionCancelBuilder> {
    public constructor() {
        super();
        this.data.type = NFTTransactionTypes.NFTAuctionCancel;
        this.data.fee = NFTAuctionCancelTransaction.staticFee();
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

    protected instance(): NFTAuctionCancelBuilder {
        return this;
    }
}
