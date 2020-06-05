import { Transactions, Utils } from "@arkecosystem/crypto";
import { NFTBaseTransactionGroup, NFTBaseTransactionTypes } from "../enums";
import { NFTRegisterCollectionTransaction } from "../transactions";

export const NFTBuilderInit = (
    transactionBuilder: Transactions.TransactionBuilder<any>,
    transactionType: NFTBaseTransactionTypes,
    asset: any,
) => {
    transactionBuilder.data.version = 2;
    transactionBuilder.data.typeGroup = NFTBaseTransactionGroup;
    transactionBuilder.data.type = transactionType;
    transactionBuilder.data.asset = asset;
    transactionBuilder.data.amount = Utils.BigNumber.ZERO;
    transactionBuilder.data.fee = NFTRegisterCollectionTransaction.staticFee();
};
