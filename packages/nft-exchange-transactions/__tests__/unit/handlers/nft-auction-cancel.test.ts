import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { configManager } from "@arkecosystem/crypto/src/managers";
import { Transactions as NFTBaseTransactions } from "@protokol/nft-base-crypto";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Builders as NFTBuilders } from "@protokol/nft-exchange-crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

import { setMockTransaction, setMockTransactions } from "../__mocks__/transaction-repository";
import { buildWallet, initApp } from "../__support__/app";
import { NFTExchangeAuctionCancelCannotCancel } from "../../../src/errors";
import { NFTAuctionCancelHandler, NFTAuctionHandler, NFTBidCancelHandler, NFTBidHandler } from "../../../src/handlers";
import { INFTAuctions } from "../../../src/interfaces";
import { auctionIndexer, bidIndexer, NFTExchangeIndexers } from "../../../src/wallet-indexes";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftCancelSellHandler: TransactionHandler;

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
        name: NFTExchangeIndexers.AuctionIndexer,
        indexer: auctionIndexer,
    });
    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: NFTExchangeIndexers.BidIndexer,
        indexer: bidIndexer,
    });

    transactionHistoryService.findManyByCriteria.mockReset();
    transactionHistoryService.findOneByCriteria.mockReset();
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    app.bind(Identifiers.TransactionHandler).to(NFTAuctionHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTAuctionCancelHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTBidHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTBidCancelHandler);

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
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTAuctionTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTAuctionCancelTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBidTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBidCancelTransaction);

    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTRegisterCollectionTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTCreateTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTTransferTransaction);
});

describe("NFT Auction Cancel tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftId: "cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d",
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
                nftId: "cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d",
                // @ts-ignore
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);
            setMockTransactions([actualBid]);

            await expect(nftCancelSellHandler.bootstrap()).toResolve();

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654410"));

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
                nftId: "cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d",
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
                nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
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
                nftId: "cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d",
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

    describe("apply tests", () => {
        it("should apply correctly", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftId: "cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d",
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
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
                nftId: "cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d",
                // @ts-ignore
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            await expect(nftCancelSellHandler.applyToSender(actual, walletRepository)).toResolve();

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7027654410"));

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
                    nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
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
                nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
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
                nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
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
                    nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
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

            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
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
                nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
                bids: [actualBid.id],
            });

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654310"));

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
                    nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
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

            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);
            transactionHistoryService.findOneByCriteria.mockResolvedValueOnce([actualCancelBid.data]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
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
                nftId: "3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c",
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
