export interface NFTCollectionAsset {
    name: string;
    description: string;
    maximumSupply: number;
    jsonSchema: object;
    allowedIssuers?: string[];
    metadata?: object;
    claimable?: boolean;
}

export interface NFTTokenAsset {
    collectionId: string;
    attributes: object;
    recipientId?: string;
}

export interface NFTTransferAsset {
    nftIds: string[];
    recipientId: string;
}

export interface NFTBurnAsset {
    nftId: string;
}

export interface NFTClaimAsset {
    collectionId: string;
}
