export const defaults = {
    nftBaseTypeGroup: 9000,
    nftCollectionName: {
        minLength: 5,
        maxLength: 40,
    },
    nftCollectionDescription: {
        minLength: 5,
        maxLength: 80,
    },
    nftCollectionAllowedIssuers: {
        minItems: 1,
        maxItems: 10,
    },
    nftTransfer: {
        minItems: 1,
        maxItems: 10,
    },
    nftCollectionByteSize: 10000,
    nftTokenByteSize: 10000,
};
