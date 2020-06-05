import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NFTBaseTransactionTypes } from "../enums";
import { NFTCollectionAsset } from "../interfaces";
import { NFTBuilderInit } from "./helpers";

export class NFTRegisterCollectionBuilder extends Transactions.TransactionBuilder<NFTRegisterCollectionBuilder> {
    constructor() {
        super();
        NFTBuilderInit(this, NFTBaseTransactionTypes.NFTRegisterCollection, { nftCollection: {} });
    }

    public NFTRegisterCollectionAsset(nftCollection: NFTCollectionAsset): NFTRegisterCollectionBuilder {
        if (this.data.asset && this.data.asset.nftCollection) {
            this.data.asset.nftCollection = {
                ...nftCollection,
            };
        }
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): NFTRegisterCollectionBuilder {
        return this;
    }
}
