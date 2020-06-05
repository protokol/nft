import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NFTBaseTransactionTypes } from "../enums";
import { NFTBurnAsset } from "../interfaces";
import { NFTBuilderInit } from "./helpers";

export class NFTBurnBuilder extends Transactions.TransactionBuilder<NFTBurnBuilder> {
    constructor() {
        super();
        NFTBuilderInit(this, NFTBaseTransactionTypes.NFTBurn, { nftBurn: {} });
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
