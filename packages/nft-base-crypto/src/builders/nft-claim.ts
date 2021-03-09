import { NFTBaseTransactionTypes } from "../enums";
import { NFTClaimAsset } from "../interfaces";
import { NFTClaimTransaction } from "../transactions";
import { NFTBaseTransactionBuilder } from "./nft-base-builder";

export class NFTClaimBuilder extends NFTBaseTransactionBuilder<NFTClaimBuilder> {
    public constructor() {
        super();
        this.data.type = NFTBaseTransactionTypes.NFTClaim;
        this.data.fee = NFTClaimTransaction.staticFee();
        this.data.asset = { nftClaim: {} };
    }

    public NFTClaimToken(nftClaim: NFTClaimAsset): NFTClaimBuilder {
        if (this.data.asset && this.data.asset.nftClaim) {
            this.data.asset.nftClaim = {
                ...nftClaim,
            };
        }
        return this;
    }

    protected instance(): NFTClaimBuilder {
        return this;
    }
}
