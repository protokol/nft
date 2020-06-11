import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Enums } from "@protokol/nft-exchange-crypto";

import { setMockTransaction, setMockTransactions } from "../__mocks__/transaction-repository";
import { buildWallet, initApp } from "../__support__/app";
import { defaults } from "../../../src/defaults";
import {
    NFTExchangeBidAuctionCanceledOrAccepted,
    NFTExchangeBidAuctionDoesNotExists,
    NFTExchangeBidAuctionExpired,
    NFTExchangeBidNotEnoughFounds,
    NFTExchangeBidStartAmountToLow,
} from "../../../src/errors";
import { NFTExchangeApplicationEvents } from "../../../src/events";
import { INFTAuctions } from "../../../src/interfaces";
import { NFTExchangeIndexers } from "../../../src/wallet-indexes";
import { buildActualAuction, buildActualBid, deregisterTransactions } from "../utils";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftBidHandler: TransactionHandler;

beforeEach(() => {
    app = initApp();

    wallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    nftBidHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTTransactionTypes.NFTBid,
            Enums.NFTExchangeTransactionsTypeGroup,
        ),
        2,
    );
    walletRepository.index(wallet);
});

afterEach(() => {
    deregisterTransactions();
});

describe("NFT Bid tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const auctionWallet = buildWallet(app, passphrases[1]);
            const actualAuction = buildActualAuction({ blockHeight: 5, passphrase: passphrases[1] });
            setMockTransactions([actualAuction]);

            const auctionsAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(auctionWallet);

            const actual = buildActualBid({ auctionId: actualAuction.id!, bidAmount: 100 });
            setMockTransaction(actual);

            await expect(nftBidHandler.bootstrap()).toResolve();

            // @ts-ignore
            expect(auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actual.id],
            });

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654210"));

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.make("100"),
            );

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actual.id)).toStrictEqual(
                auctionWallet,
            );
        });

        it("should test bootstrap with the same wallet", async () => {
            const actualAuction = buildActualAuction({ blockHeight: 5 });
            setMockTransactions([actualAuction]);
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = buildActualBid({ auctionId: actualAuction.id!, bidAmount: 100 });
            setMockTransaction(actual);

            await expect(nftBidHandler.bootstrap()).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actual.id],
            });

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654210"));

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.make("100"),
            );

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actual.id)).toStrictEqual(wallet);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw error", async () => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 5 };

            const mockGetLastBlock = jest.fn();
            StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            const actualAuction = buildActualAuction({ blockHeight: 57 });
            setMockTransactions([actualAuction]);

            const actual = buildActualBid({ auctionId: actualAuction.id! });

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toResolve();
        });

        it("should throw if nftBid is undefined", async () => {
            const actual = buildActualBid({
                auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            });
            actual.data.asset = undefined;

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toReject();
        });

        it("should throw NFTExchangeBidAuctionDoesNotExists", async () => {
            const actual = buildActualBid({
                auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            });

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTExchangeBidAuctionDoesNotExists,
            );
        });

        it("should throw NFTExchangeBidAuctionCanceledOrAccepted", async () => {
            const actualAuction = buildActualAuction({ blockHeight: 57 });
            setMockTransactions([actualAuction]);

            const actual = buildActualBid({ auctionId: actualAuction.id! });

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset["19d38808477df73997259ff0f7729e688988f19ae4b6d07099e5e22738ea4b1b"] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTExchangeBidAuctionCanceledOrAccepted,
            );
        });

        it("should throw NFTExchangeBidAuctionExpired", async () => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 6 };

            const mockGetLastBlock = jest.fn();
            StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            const actualAuction = buildActualAuction({ blockHeight: 2 });
            setMockTransactions([actualAuction]);

            const actual = buildActualBid({ auctionId: actualAuction.id! });

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTExchangeBidAuctionExpired,
            );
        });

        it("should throw NFTExchangeBidNotEnoughFounds", async () => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 5 };

            const mockGetLastBlock = jest.fn();
            StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            const actualAuction = buildActualAuction({ blockHeight: 57 });
            setMockTransactions([actualAuction]);

            const actual = buildActualBid({ auctionId: actualAuction.id!, bidAmount: 7527654311 });

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTExchangeBidNotEnoughFounds,
            );
        });

        it("should throw NFTExchangeBidStartAmountToLow", async () => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 5 };

            const mockGetLastBlock = jest.fn();
            StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            const actualAuction = buildActualAuction({ blockHeight: 57, startAmount: 2 });
            setMockTransactions([actualAuction]);

            const actual = buildActualBid({ auctionId: actualAuction.id! });

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTExchangeBidStartAmountToLow,
            );
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actualAuction = buildActualAuction({
                blockHeight: 5 + defaults.safetyDistance,
            });

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
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
                StateStore.prototype.getLastBlock = mockGetLastBlock;
                mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

                actualAuction = buildActualAuction({
                    blockHeight: 5 + defaults.safetyDistance,
                });

                const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
                // @ts-ignore
                auctionsAsset[actualAuction.id] = {
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    bids: [],
                };
                wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
                walletRepository.index(wallet);

                setMockTransactions([actualAuction]);
            });
            it("should apply correctly", async () => {
                const actual = buildActualBid({ auctionId: actualAuction.id });
                await expect(nftBidHandler.applyToSender(actual, walletRepository)).toResolve();

                // @ts-ignore
                expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    bids: [actual.id],
                });

                expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                    Utils.BigNumber.make("1"),
                );

                // @ts-ignore
                expect(walletRepository.findByIndex(NFTExchangeIndexers.BidIndexer, actual.id)).toStrictEqual(wallet);
            });

            it("should test applyToSender method with undefined wallet repository", async () => {
                const actual = buildActualBid({ auctionId: actualAuction.id });
                await expect(nftBidHandler.applyToSender(actual, undefined)).toResolve();
            });
        });
    });

    describe("revert logic tests", () => {
        let actualAuction;
        beforeEach(() => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4 };

            const mockGetLastBlock = jest.fn();
            StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            actualAuction = buildActualAuction({
                blockHeight: 5 + defaults.safetyDistance,
            });

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            setMockTransactions([actualAuction]);
        });

        it("should revert correctly", async () => {
            const actual = buildActualBid({ auctionId: actualAuction.id });

            await nftBidHandler.applyToSender(actual, walletRepository);

            await expect(nftBidHandler.revertForSender(actual, walletRepository)).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            });

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actual.id)).toBeUndefined();
        });

        it("should throw if nftBid is undefined", async () => {
            const actual = buildActualBid({ auctionId: actualAuction.id });

            await nftBidHandler.applyToSender(actual, walletRepository);
            actual.data.asset = undefined;
            await expect(nftBidHandler.revertForSender(actual, walletRepository)).toReject();
        });

        it("should test revertForSender method with undefined wallet repository", async () => {
            const actual = buildActualBid({ auctionId: actualAuction.id });

            await nftBidHandler.apply(actual, walletRepository);
            await expect(nftBidHandler.revert(actual, undefined)).toResolve();
        });
    });
});
