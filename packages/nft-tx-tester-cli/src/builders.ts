import * as MagistrateCrypto from "@arkecosystem/core-magistrate-crypto";
import { Transactions } from "@arkecosystem/crypto";
import * as NFTCrypto from "@protokol/nft-base-crypto";

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
Transactions.TransactionRegistry.registerTransactionType(NFTCrypto.Transactions.NFTRegisterCollectionTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTCrypto.Transactions.NFTCreateTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTCrypto.Transactions.NFTTransferTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTCrypto.Transactions.NFTBurnTransaction);

export const builders = {
    0: { name: "Transfer", builder: Transactions.BuilderFactory.transfer },
    1: { name: "Second Signature", builder: Transactions.BuilderFactory.secondSignature },
    2: { name: "Delegate Registration", builder: Transactions.BuilderFactory.delegateRegistration },
    3: { name: "Vote", builder: Transactions.BuilderFactory.vote },
    4: { name: "Multi Signature", builder: Transactions.BuilderFactory.multiSignature },
    5: { name: "Ipfs", builder: Transactions.BuilderFactory.ipfs },
    6: { name: "Multi Payment", builder: Transactions.BuilderFactory.multiPayment },
    7: { name: "Delegate Registration", builder: Transactions.BuilderFactory.delegateResignation },
    8: { name: "Htlc Lock", builder: Transactions.BuilderFactory.htlcLock },
    9: { name: "Htlc Claim", builder: Transactions.BuilderFactory.htlcClaim },
    10: { name: "Htlc Refund", builder: Transactions.BuilderFactory.htlcRefund },

    // TECHNICALLY, the AIP103 types are in typeGroup 2
    // and range from type 0 - 5. But to keep things simple we simply
    // pretend they follow up on HTLC.

    11: { name: "Business Registration", builder: () => new MagistrateCrypto.Builders.BusinessRegistrationBuilder() },
    12: { name: "Business Resignation", builder: () => new MagistrateCrypto.Builders.BusinessResignationBuilder() },
    13: { name: "Business Update", builder: () => new MagistrateCrypto.Builders.BusinessUpdateBuilder() },
    14: {
        name: "Bridgechain Registration",
        builder: () => new MagistrateCrypto.Builders.BridgechainRegistrationBuilder(),
    },
    15: {
        name: "Bridgechain Resignation",
        builder: () => new MagistrateCrypto.Builders.BridgechainResignationBuilder(),
    },
    16: { name: "Bridgechain Update", builder: () => new MagistrateCrypto.Builders.BridgechainUpdateBuilder() },

    // NFT transaction types
    17: { name: "NFT Register Collection", builder: () => new NFTCrypto.Builders.NFTRegisterCollectionBuilder() },
    18: { name: "NFT Create Token", builder: () => new NFTCrypto.Builders.NFTCreateBuilder() },
    19: { name: "NFT Transfer Asset", builder: () => new NFTCrypto.Builders.NFTTransferBuilder() },
    20: { name: "NFT Burn Asset", builder: () => new NFTCrypto.Builders.NFTBurnBuilder() },
};
