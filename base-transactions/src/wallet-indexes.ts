import { Contracts } from "@arkecosystem/core-kernel";

export enum NFTIndexers {
    NFTTokenIndexer = "nftTokenIndexer",
    CollectionIndexer = "nftCollectionIndexer",
}

const indexAttributeKey = (
    index: Contracts.State.WalletIndex,
    wallet: Contracts.State.Wallet,
    attributeKey: string,
): void => {
    if (wallet.hasAttribute(attributeKey)) {
        const tokens: object = wallet.getAttribute(attributeKey);

        for (const tokenId of Object.keys(tokens)) {
            index.set(tokenId, wallet);
        }
    }
};

export const nftCollectionIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    indexAttributeKey(index, wallet, "nft.base.collections");
};

export const nftIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    indexAttributeKey(index, wallet, "nft.base.tokenIds");
};
