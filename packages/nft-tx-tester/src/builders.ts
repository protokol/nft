import * as MagistrateCrypto from "@arkecosystem/core-magistrate-crypto";
import { Transactions } from "@arkecosystem/crypto";
import * as NFTBaseCrypto from "@protokol/nft-base-crypto";
import * as NFTExchangeCrypto from "@protokol/nft-exchange-crypto";

import { TransactionType } from "./enums";

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
    [TransactionType.Transfer]: { name: "Transfer", builder: Transactions.BuilderFactory.transfer },
    [TransactionType.SecondSignature]: {
        name: "Second Signature",
        builder: Transactions.BuilderFactory.secondSignature,
    },
    [TransactionType.DelegateRegistration]: {
        name: "Delegate Registration",
        builder: Transactions.BuilderFactory.delegateRegistration,
    },
    [TransactionType.Vote]: { name: "Vote", builder: Transactions.BuilderFactory.vote },
    [TransactionType.MultiSignature]: { name: "Multi Signature", builder: Transactions.BuilderFactory.multiSignature },
    [TransactionType.Ipfs]: { name: "Ipfs", builder: Transactions.BuilderFactory.ipfs },
    [TransactionType.MultiPayment]: { name: "Multi Payment", builder: Transactions.BuilderFactory.multiPayment },
    [TransactionType.DelegateResignation]: {
        name: "Delegate Resignation",
        builder: Transactions.BuilderFactory.delegateResignation,
    },
    [TransactionType.HtlcLock]: { name: "Htlc Lock", builder: Transactions.BuilderFactory.htlcLock },
    [TransactionType.HtlcClaim]: { name: "Htlc Claim", builder: Transactions.BuilderFactory.htlcClaim },
    [TransactionType.HtlcRefund]: { name: "Htlc Refund", builder: Transactions.BuilderFactory.htlcRefund },

    // TECHNICALLY, the AIP103 types are in typeGroup 2
    // and range from type 0 - 5. But to keep things simple we simply
    // pretend they follow up on HTLC.
    11: { name: "Entity", builder: () => new MagistrateCrypto.Builders.EntityBuilder() },

    // NFT transaction types
    [TransactionType.NFTRegisterCollection]: {
        name: "NFT Register Collection",
        builder: () => new NFTBaseCrypto.Builders.NFTRegisterCollectionBuilder(),
    },
    [TransactionType.NFTCreateToken]: {
        name: "NFT Create Token",
        builder: () => new NFTBaseCrypto.Builders.NFTCreateBuilder(),
    },
    [TransactionType.NFTTransferAsset]: {
        name: "NFT Transfer Asset",
        builder: () => new NFTBaseCrypto.Builders.NFTTransferBuilder(),
    },
    [TransactionType.NFTBurnAsset]: {
        name: "NFT Burn Asset",
        builder: () => new NFTBaseCrypto.Builders.NFTBurnBuilder(),
    },
    [TransactionType.NFTAuction]: {
        name: "NFT Auction",
        builder: () => new NFTExchangeCrypto.Builders.NFTAuctionBuilder(),
    },
    [TransactionType.NFTCancelAuction]: {
        name: "NFT Cancel Auction",
        builder: () => new NFTExchangeCrypto.Builders.NFTAuctionCancelBuilder(),
    },
    [TransactionType.NFTBid]: { name: "NFT Bid", builder: () => new NFTExchangeCrypto.Builders.NFTBidBuilder() },
    [TransactionType.NftCancelBid]: {
        name: "NFT Cancel Bid",
        builder: () => new NFTExchangeCrypto.Builders.NFTBidCancelBuilder(),
    },
    [TransactionType.NFTAcceptTrade]: {
        name: "NFT Accept Trade",
        builder: () => new NFTExchangeCrypto.Builders.NftAcceptTradeBuilder(),
    },
};
