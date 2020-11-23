import { passphrases } from "@arkecosystem/core-test-framework";
import { Transactions, Utils } from "@arkecosystem/crypto";
import { Transactions as NFTBaseTransactions } from "@protokol/nft-base-crypto";
import { Builders as NFTBuilders, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

export const deregisterTransactions = () => {
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTRegisterCollectionTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTCreateTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTTransferTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTBurnTransaction);

    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTAuctionTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTAuctionCancelTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBidTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBidCancelTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTAcceptTradeTransaction);
};

export const buildAuctionTransaction = ({
    blockHeight,
    passphrase,
    startAmount,
    nonce,
    nftIds,
}: {
    blockHeight: number;
    passphrase?: string;
    startAmount?: number;
    nonce?: string;
    nftIds?: string[];
}) =>
    new NFTBuilders.NFTAuctionBuilder()
        .NFTAuctionAsset({
            nftIds: nftIds || ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
            expiration: { blockHeight: blockHeight },
            startAmount: Utils.BigNumber.make(startAmount || 1),
        })
        .nonce(nonce || "1")
        .sign(passphrase || passphrases[0]!)
        .build();

export const buildBidTransaction = ({
    auctionId,
    bidAmount,
    nonce,
    passphrase,
}: {
    auctionId: string;
    bidAmount?: number;
    nonce?: string;
    passphrase?: string;
}) =>
    new NFTBuilders.NFTBidBuilder()
        .NFTBidAsset({
            auctionId,
            bidAmount: Utils.BigNumber.make(bidAmount || 1),
        })
        .nonce(nonce || "1")
        .sign(passphrase || passphrases[0]!)
        .build();
