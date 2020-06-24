import * as MagistrateCrypto from "@arkecosystem/core-magistrate-crypto";
import { Transactions } from "@arkecosystem/crypto";

Transactions.TransactionRegistry.registerTransactionType(MagistrateCrypto.Transactions.BusinessRegistrationTransaction);
Transactions.TransactionRegistry.registerTransactionType(MagistrateCrypto.Transactions.BusinessResignationTransaction);
Transactions.TransactionRegistry.registerTransactionType(MagistrateCrypto.Transactions.BusinessUpdateTransaction);
Transactions.TransactionRegistry.registerTransactionType(
    MagistrateCrypto.Transactions.BridgechainRegistrationTransaction,
);
Transactions.TransactionRegistry.registerTransactionType(
    MagistrateCrypto.Transactions.BridgechainResignationTransaction,
);
Transactions.TransactionRegistry.registerTransactionType(MagistrateCrypto.Transactions.BridgechainUpdateTransaction);

export const builders = {
    0: Transactions.BuilderFactory.transfer,
    1: Transactions.BuilderFactory.secondSignature,
    2: Transactions.BuilderFactory.delegateRegistration,
    3: Transactions.BuilderFactory.vote,
    4: Transactions.BuilderFactory.multiSignature,
    5: Transactions.BuilderFactory.ipfs,
    6: Transactions.BuilderFactory.multiPayment,
    7: Transactions.BuilderFactory.delegateResignation,
    8: Transactions.BuilderFactory.htlcLock,
    9: Transactions.BuilderFactory.htlcClaim,
    10: Transactions.BuilderFactory.htlcRefund,

    // TECHNICALLY, the AIP103 types are in typeGroup 2
    // and range from type 0 - 5. But to keep things simple we simply
    // pretend they follow up on HTLC.

    11: () => new MagistrateCrypto.Builders.BusinessRegistrationBuilder(),
    12: () => new MagistrateCrypto.Builders.BusinessResignationBuilder(),
    13: () => new MagistrateCrypto.Builders.BusinessUpdateBuilder(),
    14: () => new MagistrateCrypto.Builders.BridgechainRegistrationBuilder(),
    15: () => new MagistrateCrypto.Builders.BridgechainResignationBuilder(),
    16: () => new MagistrateCrypto.Builders.BridgechainUpdateBuilder(),
};

export const transactions = {
    0: "Transfer",
    1: "Second Signature",
    2: "Delegate Registration",
    3: "Vote",
    4: "Multi Signature",
    5: "Ipfs",
    6: "Multi Payment",
    7: "Delegate Registration",
    8: "Htlc Lock",
    9: "Htlc Claim",
    10: "Htlc Refound",

    11: "Business Registration",
    12: "Business Resignation",
    13: "Business Update",
    14: "Bridgechain Registration",
    15: "Bridgechain Resignation",
    16: "Bridgechain Update",
};
