import { defaults } from "./defaults";

export enum NFTBaseTransactionTypes {
    NFTRegisterCollection = 0,
    NFTCreate = 1,
    NFTTransfer = 2,
    NFTBurn = 3,
}

export const NFTBaseTransactionGroup = defaults.nftBaseTypeGroup;

export const NFTBaseTransactionVersion = 2;

export enum NFTBaseStaticFees {
    NFTRegisterCollection = "500000000",
    NFTCreate = "500000000",
    NFTTransfer = "500000000",
    NFTBurn = "500000000",
}
