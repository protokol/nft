import { Utils } from "@arkecosystem/crypto";

export interface NFTAuctionAsset {
    nftIds: string[];
    startAmount: Utils.BigNumber;
    expiration: {
        blockHeight: number;
    };
}

export interface NFTAuctionCancel {
    auctionId: string;
}

export interface NFTBidAsset {
    auctionId: string;
    bidAmount: Utils.BigNumber;
}

export interface NFTBidCancelAsset {
    bidId: string;
}

export interface NFTAcceptTradeAsset {
    auctionId: string;
    bidId: string;
}
