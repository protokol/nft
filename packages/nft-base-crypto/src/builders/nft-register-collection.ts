import { Utils } from "@arkecosystem/crypto";

import { NFTBaseTransactionTypes } from "../enums";
import { NFTCollectionAsset } from "../interfaces";
import { NFTRegisterCollectionTransaction } from "../transactions";
import { NFTBaseTransactionBuilder } from "./nft-base-builder";

export class NFTRegisterCollectionBuilder extends NFTBaseTransactionBuilder<NFTRegisterCollectionBuilder> {
    public constructor() {
        super();
        this.data.type = NFTBaseTransactionTypes.NFTRegisterCollection;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.fee = NFTRegisterCollectionTransaction.staticFee();
        this.data.asset = { nftCollection: {} };
    }

    public NFTRegisterCollectionAsset(nftCollection: NFTCollectionAsset): NFTRegisterCollectionBuilder {
        if (this.data.asset && this.data.asset.nftCollection) {
            this.data.asset.nftCollection = {
                ...nftCollection,
            };
        }
        return this;
    }

    protected instance(): NFTRegisterCollectionBuilder {
        return this;
    }
}
