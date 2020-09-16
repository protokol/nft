import { ApiQuery } from "@arkecosystem/client";

import { Timestamp } from "../../timestamp";

export interface Trades {
    id: string;
    senderPublicKey: string;
    completedTrade: {
        auctionId: string;
        bidId: string;
    };
    timestamp: Timestamp;
}

export interface AllTradesQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}

export interface TradeById {
    id: string;
    senderPublicKey: string;
    completedTrade: {
        auction: {
            id: string;
            nftIds: string[];
            startAmount: string;
            expiration: {
                blockHeight: number;
            };
        };
        bid: {
            id: string;
            auctionId: string;
            bidAmount: string;
        };
    };
    timestamp: Timestamp;
}

export interface SearchTradesApiBody {
    senderPublicKey?: string;
    auctionId?: string;
    bidId?: string;
}

export interface SearchTradesApiQuery extends ApiQuery {
    orderBy: string;
}
