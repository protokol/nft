import { defaults } from "./defaults";

export enum NFTTransactionTypes {
    NFTAuction = 0,
    NFTAuctionCancel = 1,
    NFTBid = 2,
    NFTBidCancel = 3,
    NFTAcceptTrade = 4,
}

export const NFTExchangeTransactionsTypeGroup = defaults.nftExchangeTypeGroup;

export const NFTExchangeTransactionVersion = 2;

export enum NFTStaticFees {
    NFTAuction = "500000000",
    NFTAuctionCancel = "500000000",
    NFTBid = "500000000",
    NFTBidCancel = "500000000",
    NFTAcceptTrade = "500000000",
}
