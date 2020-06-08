import { Utils } from "@arkecosystem/crypto";

import { NFTBaseTransactionTypes } from "../enums";
import { NFTTokenAsset } from "../interfaces";
import { NFTCreateTransaction } from "../transactions";
import { NFTBaseTransactionBuilder } from "./nft-base-builder";

export class NFTCreateBuilder extends NFTBaseTransactionBuilder<NFTCreateBuilder> {
    public constructor() {
        super();
        this.data.type = NFTBaseTransactionTypes.NFTCreate;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.fee = NFTCreateTransaction.staticFee();
        this.data.asset = { nftToken: {} };
    }

    public NFTCreateToken(nftToken: NFTTokenAsset): NFTCreateBuilder {
        if (this.data.asset && this.data.asset.nftToken) {
            this.data.asset.nftToken = {
                ...nftToken,
            };
        }
        return this;
    }

    protected instance(): NFTCreateBuilder {
        return this;
    }
}
