import { Utils } from "@arkecosystem/crypto";

import { NFTTransactionTypes } from "../enums";
import { NFTAuctionCancel } from "../interfaces";
import { NFTAuctionCancelTransaction } from "../transactions";
import { NFTExchangeTransactionBuilder } from "./nft-exchange-builder";

export class NFTAuctionCancelBuilder extends NFTExchangeTransactionBuilder<NFTAuctionCancelBuilder> {
    public constructor() {
        super();
        this.data.type = NFTTransactionTypes.NFTAuctionCancel;
        this.data.fee = NFTAuctionCancelTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
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
