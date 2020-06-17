import { ApiQuery } from "@arkecosystem/client";

export interface Bids {
    id: string;
    senderPublicKey: string;
    nftBid: {
        auctionId: string;
        bidAmount: string;
    };
}

export interface AllBidsQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}

export interface BidsWallet {
    address: string;
    publicKey: string;
    nft: {
        collections: {
            base: {
                [collectionId: string]: any;
            };
            exchange: {
                [auctionId: string]: any;
            };
        };
    };
}

export interface SearchBidsApiBody {
    senderPublicKey?: string;
    auctionId?: string;
    bidAmount?: string;
}

export interface SearchBidsApiQuery extends ApiQuery {
    orderBy: string;
}

export interface BidCanceled {
    id: string;
    senderPublicKey: string;
    nftBidCancel: {
        bidId: string;
    };
}

export interface AllBidsCanceledQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}
