export enum NFTExchangeApplicationEvents {
    NFTAuction = "nft.exchange.auction.start",
    NFTAuctionRevert = "nft.exchange.auction.start.revert",
    NFTCancelAuction = "nft.exchange.auction.cancel",
    NFTBid = "nft.exchange.bid.open",
    NFTBidRevert = "nft.exchange.bid.open.revert",
    NFTCancelBid = "nft.exchange.bid.cancel",
    NFTAcceptTrade = "nft.exchange.trade.completed",
}
