import { Utils } from "@arkecosystem/crypto";

import { NFTBaseTransactionTypes } from "../enums";
import { NFTBurnAsset } from "../interfaces";
import { NFTRegisterCollectionTransaction } from "../transactions";
import { NFTBaseTransactionBuilder } from "./nft-base-builder";

export class NFTBurnBuilder extends NFTBaseTransactionBuilder<NFTBurnBuilder> {
    public constructor() {
        super();
        this.data.type = NFTBaseTransactionTypes.NFTBurn;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.fee = NFTRegisterCollectionTransaction.staticFee();
        this.data.asset = { nftBurn: {} };
    }

    public NFTBurnAsset(nftBurn: NFTBurnAsset): NFTBurnBuilder {
        if (this.data.asset && this.data.asset.nftBurn) {
            this.data.asset.nftBurn = {
                ...nftBurn,
            };
        }
        return this;
    }

    protected instance(): NFTBurnBuilder {
        return this;
    }
}
