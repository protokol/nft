import { AbstractNFTTransactionBuilder } from "../../../core-nft-crypto/src";
import { NFTBaseTransactionGroup, NFTBaseTransactionTypes, NFTBaseTransactionVersion } from "../enums";
import { NFTTransferAsset } from "../interfaces";
import { NFTTransferTransaction } from "../transactions";

export class NFTTransferBuilder extends AbstractNFTTransactionBuilder<NFTTransferBuilder> {
    public constructor() {
        super();
        this.data.version = NFTBaseTransactionVersion;
        this.data.typeGroup = NFTBaseTransactionGroup;
        this.data.type = NFTBaseTransactionTypes.NFTTransfer;
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
