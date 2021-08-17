import { AbstractNFTTransactionBuilder } from "../../../core-nft-crypto/src";
import { NFTBaseTransactionGroup, NFTBaseTransactionTypes, NFTBaseTransactionVersion } from "../enums";
import { NFTBurnAsset } from "../interfaces";
import { NFTBurnTransaction } from "../transactions";

export class NFTBurnBuilder extends AbstractNFTTransactionBuilder<NFTBurnBuilder> {
    public constructor() {
        super();
        this.data.version = NFTBaseTransactionVersion;
        this.data.typeGroup = NFTBaseTransactionGroup;
        this.data.type = NFTBaseTransactionTypes.NFTBurn;
        this.data.fee = NFTBurnTransaction.staticFee();
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
