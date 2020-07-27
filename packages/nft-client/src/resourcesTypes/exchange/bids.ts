import { ApiQuery } from "@arkecosystem/client";

export interface Bids {
    id: string;
    senderPublicKey: string;
    nftBid: {
        auctionId: string;
        bidAmount: string;
    };
}

export interface BidsTimestamp extends Bids {
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
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

export interface BidCanceledTimestamp extends BidCanceled {
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
}

export interface AllBidsCanceledQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}
