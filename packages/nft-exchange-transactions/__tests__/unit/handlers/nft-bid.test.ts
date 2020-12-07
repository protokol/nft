import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Enums } from "@protokol/nft-exchange-crypto";

import {
    NFTExchangeBidAuctionCanceledOrAccepted,
    NFTExchangeBidAuctionDoesNotExists,
    NFTExchangeBidAuctionExpired,
    NFTExchangeBidCannotBidOwnItem,
    NFTExchangeBidNotEnoughFounds,
    NFTExchangeBidStartAmountToLow,
} from "../../../src/errors";
import { NFTExchangeApplicationEvents } from "../../../src/events";
import { INFTAuctions } from "../../../src/interfaces";
import { NFTExchangeIndexers } from "../../../src/wallet-indexes";
import { setMockTransactions } from "../__mocks__/transaction-repository";
import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { buildAuctionTransaction, buildBidTransaction, deregisterTransactions } from "../utils";

let app: Application;

let bidWallet: Contracts.State.Wallet;

let auctionWallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let nftBidHandler: Handlers.TransactionHandler;

const id = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";

const nftIds = [id];

beforeEach(() => {
    app = initApp();

    bidWallet = buildWallet(app, passphrases[0]!);
    auctionWallet = buildWallet(app, passphrases[1]!);

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

    nftBidHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTTransactionTypes.NFTBid,
            Enums.NFTExchangeTransactionsTypeGroup,
        ),
        2,
    );
    walletRepository.index(bidWallet);
    walletRepository.index(auctionWallet);
});

afterEach(() => {
    deregisterTransactions();
});

describe("NFT Bid tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 5, passphrase: passphrases[1] });
            setMockTransactions([actualAuction]);

            const auctionsAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id!] = {
                nftIds,
                bids: [],
            };
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(auctionWallet);

            const actual = buildBidTransaction({ auctionId: actualAuction.id!, bidAmount: 100 });
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });
            await expect(nftBidHandler.bootstrap()).toResolve();

            expect(auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id!]).toStrictEqual({
                nftIds,
                bids: [actual.id!],
            });

            expect(bidWallet.balance).toStrictEqual(Utils.BigNumber.make("7527654210"));

            expect(bidWallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.make("100"),
            );

            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actual.id!)).toStrictEqual(
                auctionWallet,
            );
        });

        it("should throw NFTExchangeBidCannotBidOwnItem if trying to bid on own auction", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 5 });
            setMockTransactions([actualAuction]);
            const auctionsAsset = bidWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id!] = {
                nftIds,
                bids: [],
            };
            bidWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(bidWallet);

            const actual = buildBidTransaction({ auctionId: actualAuction.id!, bidAmount: 100 });
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });
            await expect(nftBidHandler.bootstrap()).rejects.toThrowError(NFTExchangeBidCannotBidOwnItem);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw error", async () => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 5 };

            const mockGetLastBlock = jest.fn();
            Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            const actualAuction = buildAuctionTransaction({ blockHeight: 6, passphrase: passphrases[1] });
            setMockTransactions([actualAuction]);

            const auctionsAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id!] = {
                nftIds,
                bids: [],
            };
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(auctionWallet);

            const actual = buildBidTransaction({ auctionId: actualAuction.id!, passphrase: passphrases[0]! });

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, bidWallet)).toResolve();
        });

        it("should throw if nftBid is undefined", async () => {
            const actual = buildBidTransaction({
                auctionId: id,
            });
            actual.data.asset = undefined;

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, bidWallet)).toReject();
        });

        it("should throw NFTExchangeBidAuctionDoesNotExists", async () => {
            const actual = buildBidTransaction({
                auctionId: id,
            });

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, bidWallet)).rejects.toThrowError(
                NFTExchangeBidAuctionDoesNotExists,
            );
        });

        it("should throw NFTExchangeBidAuctionCanceledOrAccepted", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 57 });
            setMockTransactions([actualAuction]);

            const actual = buildBidTransaction({ auctionId: actualAuction.id! });

            const auctionsAsset = bidWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["19d38808477df73997259ff0f7729e688988f19ae4b6d07099e5e22738ea4b1b"] = {
                nftIds,
                bids: [],
            };
            bidWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(auctionWallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, bidWallet)).rejects.toThrowError(
                NFTExchangeBidAuctionCanceledOrAccepted,
            );
        });

        it("should throw NFTExchangeBidAuctionExpired", async () => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 6 };

            const mockGetLastBlock = jest.fn();
            Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            const actualAuction = buildAuctionTransaction({ blockHeight: 2, passphrase: passphrases[1] });
            setMockTransactions([actualAuction]);

            const actual = buildBidTransaction({ auctionId: actualAuction.id! });

            const auctionsAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id!] = {
                nftIds,
                bids: [],
            };
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(auctionWallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, bidWallet)).rejects.toThrowError(
                NFTExchangeBidAuctionExpired,
            );
        });

        it("should throw NFTExchangeBidNotEnoughFounds", async () => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 5 };

            const mockGetLastBlock = jest.fn();
            Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            const actualAuction = buildAuctionTransaction({ blockHeight: 57, passphrase: passphrases[1] });
            setMockTransactions([actualAuction]);

            const actual = buildBidTransaction({ auctionId: actualAuction.id!, bidAmount: 7527654311 });

            const auctionsAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id!] = {
                nftIds,
                bids: [],
            };
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(auctionWallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, bidWallet)).rejects.toThrowError(
                NFTExchangeBidNotEnoughFounds,
            );
        });

        it("should throw NFTExchangeBidStartAmountToLow", async () => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 5 };

            const mockGetLastBlock = jest.fn();
            Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            const actualAuction = buildAuctionTransaction({
                blockHeight: 57,
                startAmount: 2,
                passphrase: passphrases[1],
            });
            setMockTransactions([actualAuction]);

            const actual = buildBidTransaction({ auctionId: actualAuction.id! });

            const auctionsAsset = bidWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id!] = {
                nftIds,
                bids: [],
            };
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(auctionWallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, bidWallet)).rejects.toThrowError(
                NFTExchangeBidStartAmountToLow,
            );
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actualAuction = buildAuctionTransaction({
                blockHeight: 5,
            });

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Container.Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftBidHandler.emitEvents(actualAuction, emitter);

            expect(spy).toHaveBeenCalledWith(NFTExchangeApplicationEvents.NFTBid, expect.anything());
        });
    });

    describe("apply logic tests", () => {
        describe("apply tests", () => {
            let actualAuction;
            beforeEach(() => {
                const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4 };

                const mockGetLastBlock = jest.fn();
                Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
                mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

                actualAuction = buildAuctionTransaction({
                    blockHeight: 5,
                    passphrase: passphrases[1],
                });

                const auctionsAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
                auctionsAsset[actualAuction.id] = {
                    nftIds,
                    bids: [],
                };
                auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
                walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(auctionWallet);

                setMockTransactions([actualAuction]);
            });

            it("should apply correctly", async () => {
                const actual = buildBidTransaction({ auctionId: actualAuction.id });
                await expect(nftBidHandler.applyToSender(actual)).toResolve();

                expect(
                    auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id],
                ).toStrictEqual({
                    nftIds,
                    bids: [actual.id!],
                });

                expect(bidWallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                    Utils.BigNumber.make("1"),
                );

                expect(walletRepository.findByIndex(NFTExchangeIndexers.BidIndexer, actual.id!)).toStrictEqual(
                    auctionWallet,
                );
            });
        });
    });

    describe("revert logic tests", () => {
        let actualAuction;
        beforeEach(() => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4 };

            const mockGetLastBlock = jest.fn();
            Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            actualAuction = buildAuctionTransaction({
                blockHeight: 5,
                passphrase: passphrases[1],
            });

            const auctionsAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id] = {
                nftIds,
                bids: [],
            };
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(auctionWallet);

            setMockTransactions([actualAuction]);
        });

        it("should revert correctly", async () => {
            const actual = buildBidTransaction({ auctionId: actualAuction.id });

            await nftBidHandler.apply(actual);

            await expect(nftBidHandler.revert(actual)).toResolve();

            expect(auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds,
                bids: [],
            });

            expect(bidWallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );

            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actual.id!)).toBeUndefined();
        });

        it("should throw if nftBid is undefined", async () => {
            const actual = buildBidTransaction({ auctionId: actualAuction.id });

            await nftBidHandler.applyToSender(actual);
            actual.data.asset = undefined;
            await expect(nftBidHandler.revertForSender(actual)).toReject();
        });
    });
});
