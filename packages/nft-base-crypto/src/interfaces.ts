export interface NFTCollectionAsset {
    name: string;
    description: string;
    maximumSupply: number;
    jsonSchema: object;
    allowedIssuers?: string[];
    metadata?: object;
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
