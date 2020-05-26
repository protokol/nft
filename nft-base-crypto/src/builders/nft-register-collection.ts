import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTBaseTransactionGroup, NFTBaseTransactionTypes } from "../enums";
import { NFTCollectionAsset } from "../interfaces";
import { NFTRegisterCollectionTransaction } from "../transactions";

export class NFTRegisterCollectionBuilder extends Transactions.TransactionBuilder<NFTRegisterCollectionBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTBaseTransactionGroup;
        this.data.type = NFTBaseTransactionTypes.NFTRegisterCollection;
        this.data.fee = NFTRegisterCollectionTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
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
