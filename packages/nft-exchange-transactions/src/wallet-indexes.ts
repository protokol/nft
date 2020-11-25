import { Contracts } from "@arkecosystem/core-kernel";

import { INFTAuctions } from "./interfaces";

export enum NFTExchangeIndexers {
    AuctionIndexer = "auctionIndexer",
    BidIndexer = "bidIndexer",
}

export const auctionIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    if (wallet.hasAttribute("nft.exchange.auctions")) {
        const auctions: object = wallet.getAttribute("nft.exchange.auctions");

        for (const auctionId of Object.keys(auctions)) {
            index.set(auctionId, wallet);
        }
    }
};

export const bidIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    if (wallet.hasAttribute("nft.exchange.auctions")) {
        const auctions = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions");

        for (const auctionId of Object.keys(auctions)) {
            for (const bid of auctions[auctionId]!.bids) {
                index.set(bid, wallet);
            }
        }
    }
};
