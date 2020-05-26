import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTBaseTransactionGroup, NFTBaseTransactionTypes } from "../enums";
import { NFTBurnAsset } from "../interfaces";
import { NFTBurnTransaction } from "../transactions";

export class NFTBurnBuilder extends Transactions.TransactionBuilder<NFTBurnBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTBaseTransactionGroup;
        this.data.type = NFTBaseTransactionTypes.NFTBurn;
        this.data.fee = NFTBurnTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
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

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): NFTBurnBuilder {
        return this;
    }
}
