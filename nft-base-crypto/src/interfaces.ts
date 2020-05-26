export interface NFTCollectionAsset {
    name: string;
    description: string;
    maximumSupply: number;
    jsonSchema: object;
    allowedIssuers?: string[];
}

export interface NFTTokenAsset {
    collectionId: string;
    attributes: object;
}

export interface NFTTransferAsset {
    nftIds: string[];
    recipientId: string;
}

export interface NFTBurnAsset {
    nftId: string;
}
