import { AbstractNFTTransactionBuilder } from "@protokol/core-nft-crypto/src";

import { NFTBaseTransactionGroup, NFTBaseTransactionTypes, NFTBaseTransactionVersion } from "../enums";
import { NFTTokenAsset } from "../interfaces";
import { NFTCreateTransaction } from "../transactions";

export class NFTCreateBuilder extends AbstractNFTTransactionBuilder<NFTCreateBuilder> {
    public constructor() {
        super();
        this.data.version = NFTBaseTransactionVersion;
        this.data.typeGroup = NFTBaseTransactionGroup;
        this.data.type = NFTBaseTransactionTypes.NFTCreate;
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
