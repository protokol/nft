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

export interface AuctionsTimestamp extends Auctions {
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
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
    nftAuctionCanceled: {
        auctionId: string;
    };
}

export interface AuctionCanceledTimestamp extends AuctionCanceled {
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
}

export interface AllAuctionCanceledQuery extends ApiQuery {
    orderBy?: string;
}
