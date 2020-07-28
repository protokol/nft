import { ApiQuery } from "@arkecosystem/client";

export interface Assets {
    id: string;
    ownerPublicKey: string;
    collectionId: string;
    // eslint-disable-next-line @typescript-eslint/member-ordering
    [attributes: string]: any;
}

export interface AssetsTimestamp extends Assets{
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
}

export interface AssetsWallet {
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
    };
    assetsIds: string[];
}

export interface AllAssetsQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}

export interface SearchAssetApiBody {
    [asset: string]: any;
}
