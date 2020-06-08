import { Utils } from "@arkecosystem/crypto";

import { NFTBaseTransactionTypes } from "../enums";
import { NFTTransferAsset } from "../interfaces";
import { NFTTransferTransaction } from "../transactions";
import { NFTBaseTransactionBuilder } from "./nft-base-builder";

export class NFTTransferBuilder extends NFTBaseTransactionBuilder<NFTTransferBuilder> {
    public constructor() {
        super();
        this.data.type = NFTBaseTransactionTypes.NFTTransfer;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.fee = NFTTransferTransaction.staticFee();
        this.data.asset = { nftTransfer: {} };
    }

    public NFTTransferAsset(nftTransfer: NFTTransferAsset): NFTTransferBuilder {
        if (this.data.asset && this.data.asset.nftTransfer) {
            this.data.asset.nftTransfer = {
                ...nftTransfer,
            };
        }
        return this;
    }

    protected instance(): NFTTransferBuilder {
        return this;
    }
}
