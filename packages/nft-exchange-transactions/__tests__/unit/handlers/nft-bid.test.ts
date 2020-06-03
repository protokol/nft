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
import { Builders as NFTBuilders } from "@protokol/nft-exchange-crypto";

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
import { INFTAuctions } from "../../../src/interfaces";
import { NFTExchangeIndexers } from "../../../src/wallet-indexes";
import { deregisterTransactions } from "../utils";
import { NFTApplicationEvents } from "../../../src/events";

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
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    expiration: { blockHeight: 5 },
                    startAmount: Utils.BigNumber.make("1"),
                })
                .nonce("1")
                .sign(passphrases[1])
                .build();
            setMockTransactions([actualAuction]);

            const auctionsAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(auctionWallet);

            const actual = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            setMockTransaction(actual);

            await expect(nftBidHandler.bootstrap()).toResolve();

            // @ts-ignore
            expect(auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actual.id],
            });

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654210"));

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actual.id)).toStrictEqual(
                auctionWallet,
            );
        });

        it("should test bootstrap with the same wallet", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    expiration: { blockHeight: 5 },
                    startAmount: Utils.BigNumber.make("1"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualAuction]);
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("100"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            setMockTransaction(actual);

            await expect(nftBidHandler.bootstrap()).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actual.id],
            });

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654210"));

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

            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 57,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualAuction]);

            const actual = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("1"),
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

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toResolve();
        });

        it("should throw NFTExchangeBidAuctionDoesNotExists", async () => {
            const actual = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTExchangeBidAuctionDoesNotExists,
            );
        });

        it("should throw NFTExchangeBidAuctionCanceledOrAccepted", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 57,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualAuction]);

            const actual = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

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

            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 2,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualAuction]);

            const actual = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("1"),
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

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTExchangeBidAuctionExpired,
            );
        });

        it("should throw NFTExchangeBidNotEnoughFounds", async () => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 5 };

            const mockGetLastBlock = jest.fn();
            StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 57,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualAuction]);

            const actual = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("7527654311"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
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

            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    startAmount: Utils.BigNumber.make("2"),
                    expiration: {
                        blockHeight: 57,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            setMockTransactions([actualAuction]);

            const actual = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    // @ts-ignore
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("1"),
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

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTExchangeBidStartAmountToLow,
            );
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actual = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 5 + defaults.safetyDistance,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftBidHandler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTApplicationEvents.NFTBid, expect.anything());
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

                actualAuction = new NFTBuilders.NFTAuctionBuilder()
                    .NFTAuctionAsset({
                        nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                        startAmount: Utils.BigNumber.make("1"),
                        expiration: {
                            blockHeight: 5 + defaults.safetyDistance,
                        },
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

                setMockTransactions([actualAuction]);
            });
            it("should apply correctly", async () => {
                const actual = new NFTBuilders.NFTBidBuilder()
                    .NFTBidAsset({
                        auctionId: actualAuction.id,
                        bidAmount: Utils.BigNumber.make("1"),
                    })
                    .nonce("1")
                    .sign(passphrases[0])
                    .build();
                await expect(nftBidHandler.applyToSender(actual, walletRepository)).toResolve();

                // @ts-ignore
                expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    bids: [actual.id],
                });

                // @ts-ignore
                expect(walletRepository.findByIndex(NFTExchangeIndexers.BidIndexer, actual.id)).toStrictEqual(wallet);
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

            actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 5 + defaults.safetyDistance,
                    },
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

            setMockTransactions([actualAuction]);
        });

        it("should revert correctly", async () => {
            const actual = new NFTBuilders.NFTBidBuilder()
                .NFTBidAsset({
                    auctionId: actualAuction.id,
                    bidAmount: Utils.BigNumber.make("1"),
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await nftBidHandler.applyToSender(actual, walletRepository);

            await expect(nftBidHandler.revertForSender(actual, walletRepository)).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            });

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actual.id)).toBeUndefined();
        });
    });
});
