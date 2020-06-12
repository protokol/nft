import { ApiQuery } from "@arkecosystem/client";

export interface Assets {
    id: string;
    ownerPublicKey: string;
    collectionId: string;
    // eslint-disable-next-line @typescript-eslint/member-ordering
    [attributes: string]: any;
}

export interface AssetsWallet {
    address: string;
    publicKey: string;
    nft: {
        collections: {
            [collectionId: string]: any;
        };
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
