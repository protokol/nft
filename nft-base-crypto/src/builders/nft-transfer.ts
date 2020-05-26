import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NFTBaseTransactionGroup, NFTBaseTransactionTypes } from "../enums";
import { NFTTransferAsset } from "../interfaces";
import { NFTTransferTransaction } from "../transactions";

export class NFTTransferBuilder extends Transactions.TransactionBuilder<NFTTransferBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = NFTBaseTransactionGroup;
        this.data.type = NFTBaseTransactionTypes.NFTTransfer;
        this.data.fee = NFTTransferTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
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

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): NFTTransferBuilder {
        return this;
    }
}
