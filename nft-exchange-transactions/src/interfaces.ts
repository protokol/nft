export type INFTAuctions = Record<string, INFTAuction>;

export interface INFTAuction {
    nftId: string;
    bids: string[];
}

// TODO remove
export interface NFTExchangeWalletAsset {
    auctions?: Auction[];

    // TODO: REMOVE LEGACY
    bids?: string[];
    sellOffers?: SellOffer[];
    acceptedTrades?: string[];
    cancelBids?: string[];
}
export interface Auction {
    nftId: string;
    auctionId: string;
    bids?: string[];
}

// TODO : REMOVE LEGACY
export interface SellOffer {
    nftId: string;
    sellOfferId: string;
    bids?: Bid[];
    cancelSell?: string;
    acceptTrade?: string;
}

export interface Bid {
    bidId: string;
    isCanceled: boolean;
}

export interface NFTBid {
    bidId: string;
    isCanceled: boolean;
}
