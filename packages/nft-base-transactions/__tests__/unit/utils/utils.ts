import "jest-extended";

import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import { INFTCollections } from "../../../src/interfaces";
import { Transactions } from "@arkecosystem/crypto";

export const collectionWalletCheck = (
    wallet: Contracts.State.Wallet,
    collectionId: string,
    currentSupply: number,
    nftCollectionAsset: NFTInterfaces.NFTCollectionAsset,
) => {
    expect(wallet.getAttribute<INFTCollections>("nft.base.collections")[collectionId]).toStrictEqual({
        currentSupply: currentSupply,
        nftCollectionAsset: nftCollectionAsset,
    });
};

export const deregisterTransactions = () => {
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTRegisterCollectionTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTCreateTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBurnTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTTransferTransaction);
}
