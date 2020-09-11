import { ApiQuery } from "@arkecosystem/client";

import { Timestamp } from "../../timestamp";

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
    timestamp: Timestamp;
}

export interface AuctionsWallet {
    address: string;
    publicKey: string;
    nft: {
        collections: {
            collectionId: string;
            currentSupply: number;
            nftCollectionAsset: {
                name: string;
                description: string;
                maximumSupply: number;
                // eslint-disable-next-line @typescript-eslint/member-ordering
                [jsonSchema: string]: any;
            };
        }[];
        auctions: {
            auctionId: string;
            nftIds: string[];
            bids: string[];
        }[];
        lockedBalance: string;
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
    nftAuctionCancel: {
        auctionId: string;
    };
    timestamp: Timestamp;
}

export interface AllAuctionCanceledQuery extends ApiQuery {
    orderBy?: string;
}
