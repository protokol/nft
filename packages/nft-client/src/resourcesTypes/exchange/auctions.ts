import { ApiQuery } from "@arkecosystem/client";

export interface Auctions {
    id: string;
    senderPublicKey: string;
    nftAuction: {
        nftIds: string[];
        startAmount: string;
        expiration: {
            blockHeight: number;
        };
    };
}

export interface AuctionsWallet {
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

export interface AllAuctionsQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}

export interface SearchAuctionsApiBody {
    senderPublicKey?: string;
    nftIds?: string[];
    startAmount?: string;
    expiration?: {
        blockHeight: number;
    };
}

export interface SearchAuctionsApiQuery extends ApiQuery {
    orderBy: string;
}

export interface AuctionCanceled {
    id: string;
    senderPublicKey: string;
    nftAuctionCanceled: {
        auctionId: string;
    };
}

export interface AllAuctionCanceledQuery extends ApiQuery {
    orderBy?: string;
}
