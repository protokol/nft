import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { configManager } from "@arkecosystem/crypto/src/managers";
import { Indexers } from "@protokol/nft-base-transactions";
import { INFTTokens } from "@protokol/nft-base-transactions/src/interfaces";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Builders as NFTBuilders } from "@protokol/nft-exchange-crypto";

import { setMockTransaction, setMockTransactions } from "../__mocks__/transaction-repository";
import { buildWallet, initApp } from "../__support__/app";
import {
    NFTExchangeAcceptTradeAuctionCanceled,
    NFTExchangeAcceptTradeAuctionDoesNotExists,
    NFTExchangeAcceptTradeBidCanceled,
    NFTExchangeAcceptTradeBidDoesNotExists,
    NFTExchangeAcceptTradeWalletCannotTrade,
} from "../../../src/errors";
import { INFTAuctions, NFTExchangeWalletAsset } from "../../../src/interfaces";
import { deregisterTransactions } from "../utils";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftAcceptTradeHandler: TransactionHandler;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);
    app = initApp();

    wallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    nftAcceptTradeHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTTransactionTypes.NFTAcceptTrade,
            Enums.NFTExchangeTransactionsTypeGroup,
        ),
        2,
    );
    walletRepository.index(wallet);
});

afterEach(() => {
    deregisterTransactions();
});

describe("NFT Accept trade tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method - resend", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            walletRepository.index(wallet);

            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    // @ts-ignore
                    bidId: actualBid.data.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);
            setMockTransaction(actual);

            await expect(nftAcceptTradeHandler.bootstrap()).toResolve();
            expect(
                walletRepository.findByIndex(
                    Indexers.NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(wallet);
            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654410"));
        });

        it("should test bootstrap with different wallet", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            walletRepository.index(wallet);

            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const secondWallet = buildWallet(app, passphrases[1]);
            walletRepository.index(secondWallet);
            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[1])
                .build();

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.data.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);
            setMockTransaction(actual);
            await expect(nftAcceptTradeHandler.bootstrap()).toResolve();
            expect(
                walletRepository.findByIndex(
                    Indexers.NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(secondWallet);
            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654410"));
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.data.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);

            await expect(nftAcceptTradeHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toResolve();
        });

        it("should throw NFTExchangeAcceptTradeWalletCannotTrade", async () => {
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    auctionId: "101879d38d914d8e9e7cb05e2153abfbfc48d9ec8193cf245112fc4de3f08e87",
                    bidId: "738fd7dc9f8d720eedb3dc89908e6310e5d15447bd367963a71dafcddf148283",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await expect(
                nftAcceptTradeHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAcceptTradeWalletCannotTrade);
        });

        it("should throw NFTExchangeAcceptTradeBidDoesNotExists", async () => {
            wallet.setAttribute<NFTExchangeWalletAsset>("nft.exchange.auctions", {});
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    auctionId: "101879d38d914d8e9e7cb05e2153abfbfc48d9ec8193cf245112fc4de3f08e87",
                    bidId: "738fd7dc9f8d720eedb3dc89908e6310e5d15447bd367963a71dafcddf148283",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await expect(
                nftAcceptTradeHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAcceptTradeBidDoesNotExists);
        });

        it("should throw NFTExchangeAcceptTradeAuctionDoesNotExists", async () => {
            wallet.setAttribute<NFTExchangeWalletAsset>("nft.exchange.auctions", {});
            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: "101879d38d914d8e9e7cb05e2153abfbfc48d9ec8193cf245112fc4de3f08e87",
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            setMockTransactions([actualBid]);
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    auctionId: "101879d38d914d8e9e7cb05e2153abfbfc48d9ec8193cf245112fc4de3f08e87",
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await expect(
                nftAcceptTradeHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAcceptTradeAuctionDoesNotExists);
        });

        it("should throw NFTExchangeAcceptTradeAuctionCanceled", async () => {
            wallet.setAttribute<NFTExchangeWalletAsset>("nft.exchange.auctions", {});
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            setMockTransactions([actualBid, actualAuction]);
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await expect(
                nftAcceptTradeHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAcceptTradeAuctionCanceled);
        });

        it("should throw NFTExchangeAcceptTradeBidCanceled", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            setMockTransactions([actualBid, actualAuction]);
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            await expect(
                nftAcceptTradeHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAcceptTradeBidCanceled);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    auctionId: "101879d38d914d8e9e7cb05e2153abfbfc48d9ec8193cf245112fc4de3f08e87",
                    bidId: "738fd7dc9f8d720eedb3dc89908e6310e5d15447bd367963a71dafcddf148283",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await expect(nftAcceptTradeHandler.throwIfCannotEnterPool(actual)).toResolve();
        });
    });

    describe("apply tests", () => {
        it("should apply correctly - resend", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            walletRepository.index(wallet);
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.data.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);

            await expect(nftAcceptTradeHandler.apply(actual, walletRepository)).toResolve();

            expect(
                walletRepository.findByIndex(
                    Indexers.NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(wallet);
            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7027654410"));
        });

        it("should test apply with different wallet ", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            walletRepository.index(wallet);
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const secondWallet = buildWallet(app, passphrases[1]);
            walletRepository.index(secondWallet);
            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[1])
                .build();

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.data.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);
            setMockTransaction(actual);

            await expect(nftAcceptTradeHandler.apply(actual, walletRepository)).toResolve();
            expect(
                walletRepository.findByIndex(
                    Indexers.NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(secondWallet);
            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7027654410"));
        });
    });

    describe("revert tests", () => {
        it("should revert correctly", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            walletRepository.index(wallet);
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 1,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.data.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);

            await nftAcceptTradeHandler.apply(actual, walletRepository);

            await expect(nftAcceptTradeHandler.revert(actual, walletRepository)).toResolve();
        });
    });
});
