import { AbstractNFTTransactionBuilder } from "@protokol/core-nft-crypto";

import { NFTExchangeTransactionsTypeGroup, NFTExchangeTransactionVersion, NFTTransactionTypes } from "../enums";
import { NFTAcceptTradeAsset } from "../interfaces";
import { NFTAcceptTradeTransaction } from "../transactions";

export class NftAcceptTradeBuilder extends AbstractNFTTransactionBuilder<NftAcceptTradeBuilder> {
    public constructor() {
        super();
        this.data.version = NFTExchangeTransactionVersion;
        this.data.typeGroup = NFTExchangeTransactionsTypeGroup;
        this.data.type = NFTTransactionTypes.NFTAcceptTrade;
        this.data.fee = NFTAcceptTradeTransaction.staticFee();
        this.data.asset = { nftAcceptTrade: {} };
    }

    public NFTAcceptTradeAsset(nftAcceptTrade: NFTAcceptTradeAsset): NftAcceptTradeBuilder {
        if (this.data.asset && this.data.asset.nftAcceptTrade) {
            this.data.asset.nftAcceptTrade = {
                ...nftAcceptTrade,
            };
        }
        return this;
    }

    protected instance(): NftAcceptTradeBuilder {
        return this;
    }
}
