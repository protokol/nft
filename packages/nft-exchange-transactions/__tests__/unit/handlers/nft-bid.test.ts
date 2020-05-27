import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { configManager } from "@arkecosystem/crypto/src/managers";
import { Transactions as NFTBaseTransactions } from "@protokol/nft-base-crypto";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Builders as NFTBuilders } from "@protokol/nft-exchange-crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

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
import { NFTAuctionCancelHandler, NFTAuctionHandler } from "../../../src/handlers";
import { NFTBidHandler } from "../../../src/handlers";
import { INFTAuctions } from "../../../src/interfaces";
import { bidIndexer, NFTExchangeIndexers } from "../../../src/wallet-indexes";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftBidHandler: TransactionHandler;

const transactionHistoryService = {
    findManyByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
};

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);
    app = initApp();

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: NFTExchangeIndexers.BidIndexer,
        indexer: bidIndexer,
    });
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    app.bind(Identifiers.TransactionHandler).to(NFTAuctionHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTAuctionCancelHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTBidHandler);

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
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTAuctionTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTAuctionCancelTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBidTransaction);

    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTRegisterCollectionTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTCreateTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTTransferTransaction);
});

describe("NFT Bid tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const auctionWallet = buildWallet(app, passphrases[1]);
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            await expect(nftBidHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTExchangeBidStartAmountToLow,
            );
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
                        nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [],
            });

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actual.id)).toBeUndefined();
        });
    });
});
