import "jest-extended";

import { Transactions } from "@arkecosystem/crypto";
import { Transactions as GuardianTransactions } from "@protokol/guardian-crypto";

export const deregisterTransactions = () => {
    Transactions.TransactionRegistry.deregisterTransactionType(GuardianTransactions.GuardianUserPermissionsTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(
        GuardianTransactions.GuardianGroupPermissionsTransaction,
    );
};
