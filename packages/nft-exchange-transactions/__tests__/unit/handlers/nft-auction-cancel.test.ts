import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Transactions, Utils } from "@arkecosystem/crypto";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Builders as NFTBuilders } from "@protokol/nft-exchange-crypto";

import { setMockFindByIds, setMockTransaction, setMockTransactions } from "../__mocks__/transaction-repository";
import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { NFTExchangeAuctionCancelCannotCancel } from "../../../src/errors";
import { NFTExchangeApplicationEvents } from "../../../src/events";
import { INFTAuctions } from "../../../src/interfaces";
import { NFTExchangeIndexers } from "../../../src/wallet-indexes";
import { deregisterTransactions } from "../utils";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftCancelSellHandler: TransactionHandler;

beforeEach(() => {
    app = initApp();

    wallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    nftCancelSellHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTTransactionTypes.NFTAuctionCancel,
            Enums.NFTExchangeTransactionsTypeGroup,
        ),
        2,
    );
    walletRepository.index(wallet);
});

afterEach(() => {
    deregisterTransactions();
});

describe("NFT Auction Cancel tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            setMockTransaction(actual);

            await expect(nftCancelSellHandler.bootstrap()).toResolve();

            expect(
                wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeUndefined();

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(actual.id)).toBeUndefined();
        });

        it("should test bootstrap method with bids", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransaction(actual);

            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                // @ts-ignore
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);
            setMockTransactions([actualBid]);
            setMockFindByIds([actualBid]);

            await expect(nftCancelSellHandler.bootstrap()).toResolve();

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654410"));

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.make("100"),
            );

            expect(
                wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeUndefined();
            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(actual.id)).toBeUndefined();

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id)).toBeUndefined();
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftCancelSellHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toResolve();
        });

        it("should throw NFTExchangeAuctionCancelCannotCancel, because wallet doesn't own nft.exchange", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                nftCancelSellHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAuctionCancelCannotCancel);
        });

        it("should throw NFTExchangeAuctionCancelCannotCancel, because wallet doesn't own wanted auction", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["fa52e0215b2567114ae18154d3509c8e04fb28db4cf4217175ebb0b737fc24d6"] = {
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                nftCancelSellHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAuctionCancelCannotCancel);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftCancelSellHandler.throwIfCannotEnterPool(actual)).toResolve();
        });

        it("should throw because transaction for cancel is already in pool", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("2")
                .sign(passphrases[0])
                .build();

            await expect(nftCancelSellHandler.throwIfCannotEnterPool(actualTwo)).rejects.toThrowError();
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftCancelSellHandler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTExchangeApplicationEvents.NFTCancelAuction, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should apply correctly", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await expect(nftCancelSellHandler.applyToSender(actual, walletRepository)).toResolve();

            expect(
                wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeUndefined();

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(actual.id)).toBeUndefined();
        });

        it("should apply correctly with bids", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualBid]);
            setMockFindByIds([actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                // @ts-ignore
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            await expect(nftCancelSellHandler.applyToSender(actual, walletRepository)).toResolve();

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7027654410"));

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.make("100"),
            );

            expect(
                wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeUndefined();

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(actual.id)).toBeUndefined();

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id)).toBeUndefined();
        });
    });

    describe("revert tests", () => {
        it("should revert correctly", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                    expiration: {
                        blockHeight: 4,
                    },
                    startAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualAuction]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await nftCancelSellHandler.applyToSender(actual, walletRepository);

            await expect(nftCancelSellHandler.revertForSender(actual, walletRepository)).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [],
            });

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id)).toStrictEqual(
                wallet,
            );
        });

        it("should revert correctly with bids", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                    expiration: {
                        blockHeight: 4,
                    },
                    startAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualAuction, actualBid]);
            setMockFindByIds([actualBid]);

            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await nftCancelSellHandler.applyToSender(actual, walletRepository);

            await expect(nftCancelSellHandler.revertForSender(actual, walletRepository)).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [actualBid.id],
            });

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654310"));

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id)).toStrictEqual(
                wallet,
            );

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.BidIndexer, actualBid.id)).toStrictEqual(wallet);
        });

        it("should revert correctly with bids and cancel bids", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                    expiration: {
                        blockHeight: 4,
                    },
                    startAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actualBid = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const actualCancelBid = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualAuction, actualBid, actualCancelBid]);
            setMockFindByIds([actualBid]);

            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);
            transactionHistoryService.findOneByCriteria.mockResolvedValueOnce([actualCancelBid.data]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await nftCancelSellHandler.applyToSender(actual, walletRepository);

            await expect(nftCancelSellHandler.revertForSender(actual, walletRepository)).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [],
            });

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id)).toStrictEqual(
                wallet,
            );

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id)).toBeUndefined();
        });
    });
});
