import { ApiQuery } from "@arkecosystem/client";

export interface Collections {
    id: string;
    senderPublicKey: string;
    name: string;
    description: string;
    maximumSupply: number;
    // eslint-disable-next-line @typescript-eslint/member-ordering
    [jsonSchema: string]: any;
}

export interface CollectionsTimestamp extends Collections {
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
}

export interface AllCollectionsQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}

export interface Schema {
    id: string;
    senderPublicKey: string;
    // eslint-disable-next-line @typescript-eslint/member-ordering
    [properties: string]: any;
}

export interface CollectionsWallet {
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
        assetsIds: string[];
    };
}

export interface SearchCollectionsApiBody {
    [collection: string]: any;
}

export interface CollectionsAsset {
    id: string;
    ownerPublicKey: string;
    senderPublicKey: string;
    collectionId: string;
    // eslint-disable-next-line @typescript-eslint/member-ordering
    [attributes: string]: any;
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
}
