import { Transactions } from "@arkecosystem/crypto";
import { Transactions as NFTBaseTransactions } from "@protokol/nft-base-crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

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
