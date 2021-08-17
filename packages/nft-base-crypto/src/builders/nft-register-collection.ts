import { AbstractNFTTransactionBuilder } from "../../../core-nft-crypto/src";
import { NFTBaseTransactionGroup, NFTBaseTransactionTypes, NFTBaseTransactionVersion } from "../enums";
import { NFTCollectionAsset } from "../interfaces";
import { NFTRegisterCollectionTransaction } from "../transactions";

export class NFTRegisterCollectionBuilder extends AbstractNFTTransactionBuilder<NFTRegisterCollectionBuilder> {
    public constructor() {
        super();
        this.data.version = NFTBaseTransactionVersion;
        this.data.typeGroup = NFTBaseTransactionGroup;
        this.data.type = NFTBaseTransactionTypes.NFTRegisterCollection;
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
