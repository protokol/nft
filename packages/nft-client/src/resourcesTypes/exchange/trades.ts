import { ApiQuery } from "@arkecosystem/client";

export interface Trades {
    id: string;
    senderPublicKey: string;
    completedTrade: {
        auctionId: string;
        bidId: string;
    };
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
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
            bitAmount: string;
        };
    };
}

export interface SearchTradesApiBody {
    senderPublicKey?: string;
    auctionId?: string;
    bidId?: string;
}

export interface SearchTradesApiQuery extends ApiQuery {
    orderBy: string;
}
