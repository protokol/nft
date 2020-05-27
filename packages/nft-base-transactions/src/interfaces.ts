import { Interfaces } from "@protokol/nft-base-crypto";

export type INFTCollections = Record<string, INFTCollection>;

export interface INFTCollection {
    nftCollectionAsset: Interfaces.NFTCollectionAsset;
    currentSupply: number;
}

export type INFTTokens = {};

// TODO: remove
export interface NFTRegisteredCollection {
    nftCollectionAsset: Interfaces.NFTCollectionAsset;
    currentSupply: number;
    collectionId: string;
}

export interface NFTBaseWalletAsset {
    nftCollections?: NFTRegisteredCollection[];
    nftIds?: string[];
}
