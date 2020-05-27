import { Interfaces } from "../../../../../packages/crypto";
import { Builders } from "@protokol/nft-base-crypto";

import { buildTransaction } from "./builder";

export const buildTokenCollection = async (payloadData: {
    name: string;
    description: string;
    maximumSupply: number;
    jsonSchema: object;
    nonce?: number;
    passphrase: string;
}): Promise<Interfaces.ITransactionData> => {
    const nftRegisterCollectionBuilder = new Builders.NFTRegisterCollectionBuilder().NFTRegisterCollectionAsset({
        name: payloadData.name,
        description: payloadData.description,
        maximumSupply: payloadData.maximumSupply,
        jsonSchema: payloadData.jsonSchema,
    });

    return buildTransaction(nftRegisterCollectionBuilder, payloadData);
};

export const buildTokenAsset = async (payloadData: {
    collectionId: string;
    attributes: object;
    nonce?: number;
    passphrase: string;
}): Promise<Interfaces.ITransactionData> => {
    const nftCreateBuilder = new Builders.NFTCreateBuilder().NFTCreateToken({
        collectionId: payloadData.collectionId,
        attributes: payloadData.attributes,
    });

    return buildTransaction(nftCreateBuilder, payloadData);
};

export const buildTokenTransfer = async (payloadData: {
    nftIds: string[];
    recipientId: string;
    nonce?: number;
    passphrase: string;
}): Promise<Interfaces.ITransactionData> => {
    const nftTransferBuilder = new Builders.NFTTransferBuilder().NFTTransferAsset({
        nftIds: payloadData.nftIds,
        recipientId: payloadData.recipientId,
    });

    return buildTransaction(nftTransferBuilder, payloadData);
};

export const buildTokenBurn = async (payloadData: {
    nftId: string;
    nonce?: number;
    passphrase: string;
}): Promise<Interfaces.ITransactionData> => {
    const nftBurnToken = new Builders.NFTBurnBuilder().NFTBurnAsset({
        nftId: payloadData.nftId,
    });

    return buildTransaction(nftBurnToken, payloadData);
};
