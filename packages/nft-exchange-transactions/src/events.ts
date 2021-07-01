export enum NFTExchangeApplicationEvents {
    NFTAuction = "nft.exchange.auction.start",
    NFTAuctionRevert = "nft.exchange.auction.start.revert",
    NFTCancelAuction = "nft.exchange.auction.cancel",
    NFTCancelAuctionRevert = "nft.exchange.auction.cancel.revert",
    NFTBid = "nft.exchange.bid.open",
    NFTBidRevert = "nft.exchange.bid.open.revert",
    NFTCancelBid = "nft.exchange.bid.cancel",
    NFTCancelBidRevert = "nft.exchange.bid.cancel.revert",
    NFTAcceptTrade = "nft.exchange.trade.completed",
    NFTAcceptTradeRevert = "nft.exchange.trade.completed.revert",
}
