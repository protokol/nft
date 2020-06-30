import { Interfaces } from "@protokol/nft-base-crypto";

export type INFTCollections = Record<string, INFTCollection>;

export interface INFTCollection {
    nftCollectionAsset: Interfaces.NFTCollectionAsset;
    currentSupply: number;
}

export type INFTTokens = {};
