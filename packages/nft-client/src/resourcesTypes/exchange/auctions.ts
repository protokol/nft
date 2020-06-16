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
