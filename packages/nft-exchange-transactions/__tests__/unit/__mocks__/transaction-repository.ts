import { Interfaces } from "@arkecosystem/crypto/";

let mockTransaction: Interfaces.ITransaction | null;
let mockTransactions: Interfaces.ITransaction[] = [];
let mockFindByIds: Interfaces.ITransaction[] = [];

export const setMockTransaction = (transaction: Interfaces.ITransaction | null) => {
    mockTransaction = transaction;
};

export const setMockTransactions = (transactions: Interfaces.ITransaction[]) => {
    mockTransactions = transactions;
};

export const setMockFindByIds = (transactions: Interfaces.ITransaction[]) => {
    mockFindByIds = transactions;
};

export const transactionRepository = {
    findById(id: string): any {
        if (mockTransactions !== null && mockTransactions.length === 0) {
            return mockTransaction?.data;
        }
        const trx = mockTransactions.find((trx) => trx.data.id === id);
        return trx?.data;
    },
    findByIds: async () => {
        const mocks = mockFindByIds.map((mock) => mock.data);
        return mockFindByIds ? mocks : [];
    },
    findByType: async () => {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    findReceivedTransactions() {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    getOpenHtlcLocks() {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    getClaimedHtlcLockBalances() {
        return mockTransaction
            ? [{ amount: mockTransaction.data.amount, recipientId: mockTransaction.data.recipientId }]
            : [];
    },
    getRefundedHtlcLockBalances() {
        return mockTransaction
            ? [{ amount: mockTransaction.data.amount, senderPublicKey: mockTransaction.data.senderPublicKey }]
            : [];
    },
};
