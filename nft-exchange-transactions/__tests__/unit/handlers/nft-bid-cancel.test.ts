import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
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
import {
    NFTExchangeBidCancelAuctionCanceledOrAccepted,
    NFTExchangeBidCancelBidCanceled,
    NFTExchangeBidCancelBidDoesNotExists,
} from "../../../src/errors";
import { NFTAuctionCancelHandler, NFTAuctionHandler } from "../../../src/handlers";
import { NFTBidHandler } from "../../../src/handlers";
import { NFTBidCancelHandler } from "../../../src/handlers";
import { INFTAuctions } from "../../../src/interfaces";
import { auctionIndexer, bidIndexer, NFTExchangeIndexers } from "../../../src/wallet-indexes";
import { Mempool } from "@arkecosystem/core-transaction-pool";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftBidCancelHandler: TransactionHandler;

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
    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: NFTExchangeIndexers.AuctionIndexer,
        indexer: auctionIndexer,
    });

    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    app.bind(Identifiers.TransactionHandler).to(NFTAuctionHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTBidHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTAuctionCancelHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTBidCancelHandler);

    wallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    nftBidCancelHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTTransactionTypes.NFTBidCancel,
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

describe("NFT Bid Cancel tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                    expiration: { blockHeight: 4 },
                    startAmount: Utils.BigNumber.make("1"),
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

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            setMockTransaction(actual);

            await expect(nftBidCancelHandler.bootstrap()).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [],
            });
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id)).toBeUndefined();
            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id)).toStrictEqual(
                wallet,
            );
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should throw NFTExchangeBidCancelBidDoesNotExists", async () => {
            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    bidId: "e5ff17de47e33551c7991b72921201b55e1362ef897542e0fd7a038cd262b971",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                nftBidCancelHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeBidCancelBidDoesNotExists);
        });
        it("should throw NFTExchangeBidCancelAuctionCanceledOrAccepted", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                    expiration: { blockHeight: 4 },
                    startAmount: Utils.BigNumber.make("1"),
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

            setMockTransactions([actualAuction, actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["703b87044730ee74862ca513c6d86f69e97d43a5ac8a3f68a1b18d9ac793e200"] = {
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                nftBidCancelHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeBidCancelAuctionCanceledOrAccepted);
        });

        it("should throw NFTExchangeBidCancelBidCanceled", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                    expiration: { blockHeight: 4 },
                    startAmount: Utils.BigNumber.make("1"),
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

            setMockTransactions([actualAuction, actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                nftBidCancelHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeBidCancelBidCanceled);
        });

        it("should not throw ", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                    expiration: { blockHeight: 4 },
                    startAmount: Utils.BigNumber.make("1"),
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

            setMockTransactions([actualAuction, actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftBidCancelHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toResolve();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    bidId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftBidCancelHandler.throwIfCannotEnterPool(actual)).toResolve();
        });

        it("should throw error", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                    expiration: { blockHeight: 4 },
                    startAmount: Utils.BigNumber.make("1"),
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

            setMockTransactions([actualAuction, actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await expect(nftBidCancelHandler.throwIfCannotEnterPool(actualTwo)).rejects.toThrowError();
        });
    });

    describe("apply tests", () => {
        it("should apply correctly", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                    expiration: { blockHeight: 4 },
                    startAmount: Utils.BigNumber.make("1"),
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

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftBidCancelHandler.applyToSender(actual, walletRepository)).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [],
            });

            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id)).toBeUndefined();
            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id)).toStrictEqual(
                wallet,
            );
        });
    });
    describe("revert tests", () => {
        it("should revert correctly", async () => {
            const actualAuction = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                    expiration: { blockHeight: 4 },
                    startAmount: Utils.BigNumber.make("1"),
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

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await nftBidCancelHandler.apply(actual, walletRepository);
            await expect(nftBidCancelHandler.revert(actual, walletRepository)).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftId: "961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506",
                bids: [actualBid.id],
            });
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id)).toStrictEqual(wallet);
            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id)).toStrictEqual(
                wallet,
            );
        });
    });
});
