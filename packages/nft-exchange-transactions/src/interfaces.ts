export type INFTAuctions = Record<string, INFTAuction>;

export interface INFTAuction {
    nftIds: string[];
    bids: string[];
}

// TODO remove
// export interface NFTExchangeWalletAsset {
//     auctions?: Auction[];
// }
// export interface Auction {
//     nftId: string;
//     auctionId: string;
//     bids?: string[];
// }
