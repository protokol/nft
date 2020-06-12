import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Transactions, Utils } from "@arkecosystem/crypto";
import { Indexers } from "@protokol/nft-base-transactions";
import { INFTTokens } from "@protokol/nft-base-transactions/src/interfaces";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Builders as NFTBuilders } from "@protokol/nft-exchange-crypto";

import { setMockFindByIds, setMockTransaction, setMockTransactions } from "../__mocks__/transaction-repository";
import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import {
    NFTExchangeAcceptTradeAuctionCanceled,
    NFTExchangeAcceptTradeAuctionDoesNotExists,
    NFTExchangeAcceptTradeBidCanceled,
    NFTExchangeAcceptTradeBidDoesNotExists,
    NFTExchangeAcceptTradeWalletCannotTrade,
} from "../../../src/errors";
import { NFTExchangeApplicationEvents } from "../../../src/events";
import { INFTAuctions } from "../../../src/interfaces";
import { buildAuctionTransaction, buildBidTransaction, deregisterTransactions } from "../utils";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftAcceptTradeHandler: TransactionHandler;

beforeEach(() => {
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

            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id!, bidAmount: 100 });

            const actualBidTwo = buildBidTransaction({
                auctionId: actualAuction.id!,
                bidAmount: 100,
                passphrase: passphrases[1],
            });

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
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid, actualBidTwo]);
            setMockFindByIds([actualBid, actualBidTwo]);
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

            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const secondWallet = buildWallet(app, passphrases[1]);
            walletRepository.index(secondWallet);
            secondWallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.make("100"));

            const actualBid = buildBidTransaction({
                auctionId: actualAuction.id!,
                bidAmount: 100,
                passphrase: passphrases[1],
            });

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);
            setMockFindByIds([actualBid]);
            setMockTransaction(actual);
            await expect(nftAcceptTradeHandler.bootstrap()).toResolve();
            expect(
                walletRepository.findByIndex(
                    Indexers.NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(secondWallet);
            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654410"));
            expect(secondWallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id! });

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
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                // @ts-ignore
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);

            await expect(nftAcceptTradeHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toResolve();
        });

        it("should throw if nftAcceptTrade is undefined", async () => {
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    auctionId: "101879d38d914d8e9e7cb05e2153abfbfc48d9ec8193cf245112fc4de3f08e87",
                    bidId: "738fd7dc9f8d720eedb3dc89908e6310e5d15447bd367963a71dafcddf148283",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            actual.data.asset = undefined;

            await expect(nftAcceptTradeHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toReject();
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
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", {});
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
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", {});
            const actualBid = buildBidTransaction({
                auctionId: "101879d38d914d8e9e7cb05e2153abfbfc48d9ec8193cf245112fc4de3f08e87",
            });

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
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", {});
            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id! });

            setMockTransactions([actualBid, actualAuction]);
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await expect(
                nftAcceptTradeHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAcceptTradeAuctionCanceled);
        });

        it("should throw NFTExchangeAcceptTradeBidCanceled", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id! });

            setMockTransactions([actualBid, actualAuction]);
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
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

        it("should throw because transaction for accept trade is already in pool", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: ["738fd7dc9f8d720eedb3dc89908e6310e5d15447bd367963a71dafcddf148283"],
            };

            const actualBid = buildBidTransaction({ auctionId: actualAuction.id!, bidAmount: 100 });

            auctionsAsset[actualAuction.id!] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id!],
            };

            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    auctionId: actualAuction.id!,
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(actual);

            await expect(nftAcceptTradeHandler.throwIfCannotEnterPool(actual)).rejects.toThrowError();
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    auctionId: "7259d7a1268e862caa1ea090c1ab4c80f58378ad8fff1de89bd9e24a38ce4674",
                    bidId: "a9694da51aae3f7d9d944fbc4c81991d1b837bb9f8e77ae5f2fa171770749fd4",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftAcceptTradeHandler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTExchangeApplicationEvents.NFTAcceptTrade, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should apply correctly - resend", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            walletRepository.index(wallet);
            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id!, bidAmount: 100 });

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);
            setMockFindByIds([actualBid]);

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
            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const secondWallet = buildWallet(app, passphrases[1]);
            walletRepository.index(secondWallet);
            secondWallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.make("100"));

            const actualBid = buildBidTransaction({
                auctionId: actualAuction.id!,
                bidAmount: 100,
                passphrase: passphrases[1],
            });

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);
            setMockFindByIds([actualBid]);
            setMockTransaction(actual);

            await expect(nftAcceptTradeHandler.apply(actual, walletRepository)).toResolve();
            expect(
                walletRepository.findByIndex(
                    Indexers.NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(secondWallet);
            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7027654410"));

            expect(secondWallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );
        });
    });

    describe("revert tests", () => {
        it("should revert correctly", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            walletRepository.index(wallet);
            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id!, bidAmount: 100 });

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);
            setMockFindByIds([actualBid]);
            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);

            await nftAcceptTradeHandler.apply(actual, walletRepository);

            await expect(nftAcceptTradeHandler.revert(actual, walletRepository)).toResolve();
        });

        it("should throw if nftAcceptTrade is undefined", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            walletRepository.index(wallet);
            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });

            const actualBid = buildBidTransaction({ auctionId: actualAuction.id!, bidAmount: 100 });

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);
            setMockFindByIds([actualBid]);
            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);

            await nftAcceptTradeHandler.apply(actual, walletRepository);
            actual.data.asset = undefined;
            await expect(nftAcceptTradeHandler.revert(actual, walletRepository)).toReject();
        });

        it("should test revert method with undefined wallet repository", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            walletRepository.index(wallet);
            const actualAuction = buildAuctionTransaction({ blockHeight: 1 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id!, bidAmount: 100 });

            const actual = new NFTBuilders.NftAcceptTradeBuilder()
                .NFTAcceptTradeAsset({
                    // @ts-ignore
                    auctionId: actualAuction.data.id,
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction, actualBid]);
            setMockFindByIds([actualBid]);
            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);
            transactionHistoryService.findOneByCriteria.mockResolvedValueOnce([actual.data]);

            await nftAcceptTradeHandler.apply(actual, walletRepository);
            await expect(nftAcceptTradeHandler.revert(actual, undefined)).toResolve();
        });
    });
});
