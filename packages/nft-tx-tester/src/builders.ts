import * as MagistrateCrypto from "@arkecosystem/core-magistrate-crypto";
import { Transactions } from "@arkecosystem/crypto";
import * as NFTBaseCrypto from "@protokol/nft-base-crypto";
import * as NFTExchangeCrypto from "@protokol/nft-exchange-crypto";

Transactions.TransactionRegistry.registerTransactionType(MagistrateCrypto.Transactions.EntityTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTBaseCrypto.Transactions.NFTRegisterCollectionTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTBaseCrypto.Transactions.NFTCreateTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTBaseCrypto.Transactions.NFTTransferTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTBaseCrypto.Transactions.NFTBurnTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTExchangeCrypto.Transactions.NFTAuctionTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTExchangeCrypto.Transactions.NFTAuctionCancelTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTExchangeCrypto.Transactions.NFTBidTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTExchangeCrypto.Transactions.NFTBidCancelTransaction);
Transactions.TransactionRegistry.registerTransactionType(NFTExchangeCrypto.Transactions.NFTAcceptTradeTransaction);

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
    11: { name: "Entity", builder: () => new MagistrateCrypto.Builders.EntityBuilder() },

    // NFT transaction types
    12: { name: "NFT Register Collection", builder: () => new NFTBaseCrypto.Builders.NFTRegisterCollectionBuilder() },
    13: { name: "NFT Create Token", builder: () => new NFTBaseCrypto.Builders.NFTCreateBuilder() },
    14: { name: "NFT Transfer Asset", builder: () => new NFTBaseCrypto.Builders.NFTTransferBuilder() },
    15: { name: "NFT Burn Asset", builder: () => new NFTBaseCrypto.Builders.NFTBurnBuilder() },
    16: { name: "NFT Auction", builder: () => new NFTExchangeCrypto.Builders.NFTAuctionBuilder() },
    17: { name: "NFT Cancel Auction", builder: () => new NFTExchangeCrypto.Builders.NFTAuctionCancelBuilder() },
    18: { name: "NFT Bid", builder: () => new NFTExchangeCrypto.Builders.NFTBidBuilder() },
    19: { name: "NFT Cancel Bid", builder: () => new NFTExchangeCrypto.Builders.NFTBidCancelBuilder() },
    20: { name: "NFT Accept Trade", builder: () => new NFTExchangeCrypto.Builders.NftAcceptTradeBuilder() },
};
