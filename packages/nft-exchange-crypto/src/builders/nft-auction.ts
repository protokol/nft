import { Utils } from "@arkecosystem/crypto";

import { NFTTransactionTypes } from "../enums";
import { NFTAuctionAsset } from "../interfaces";
import { NFTAuctionTransaction } from "../transactions";
import { NFTExchangeTransactionBuilder } from "./nft-exchange-builder";

export class NFTAuctionBuilder extends NFTExchangeTransactionBuilder<NFTAuctionBuilder> {
    public constructor() {
        super();
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

    protected instance(): NFTAuctionBuilder {
        return this;
    }
}
