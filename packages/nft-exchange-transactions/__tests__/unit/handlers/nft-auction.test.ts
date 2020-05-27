import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { configManager } from "@arkecosystem/crypto/src/managers";
import { Transactions as NFTBaseTransactions } from "@protokol/nft-base-crypto";
import { Interfaces as NFTBaseInterfaces } from "@protokol/nft-base-transactions";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Builders as NFTBuilders } from "@protokol/nft-exchange-crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

import { setMockTransaction } from "../__mocks__/transaction-repository";
import { buildWallet, initApp } from "../__support__/app";
import {
    NFTExchangeAuctionAlreadyInProgress,
    NFTExchangeAuctioneerDoesNotOwnAnyNft,
    NFTExchangeAuctioneerDoesNotOwnNft,
    NFTExchangeAuctionExpired,
} from "../../../src/errors";
import { NFTAuctionHandler } from "../../../src/handlers";
import { INFTAuctions } from "../../../src/interfaces";
import { auctionIndexer, NFTExchangeIndexers } from "../../../src/wallet-indexes";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftAuctionHandler: TransactionHandler;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);
    app = initApp();

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: NFTExchangeIndexers.AuctionIndexer,
        indexer: auctionIndexer,
    });

    app.bind(Identifiers.TransactionHandler).to(NFTAuctionHandler);

    wallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    nftAuctionHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTTransactionTypes.NFTAuction,
            Enums.NFTExchangeTransactionsTypeGroup,
        ),
        2,
    );
    walletRepository.index(wallet);
});

afterEach(() => {
    Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTAuctionTransaction);

    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTRegisterCollectionTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTCreateTransaction);
    Transactions.TransactionRegistry.deregisterTransactionType(NFTBaseTransactions.NFTTransferTransaction);
});

describe("NFT Auction tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const actual = new NFTBuilders.NFTAuctionBuilder()
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

            setMockTransaction(actual);

            await expect(nftAuctionHandler.bootstrap()).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actual.id]).toStrictEqual({
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [],
            });

            // @ts-ignore
            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(actual.id)).toStrictEqual(wallet);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4 };

        const mockGetLastBlock = jest.fn();
        StateStore.prototype.getLastBlock = mockGetLastBlock;
        mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

        it("should throw NFTExchangeAuctionExpired", async () => {
            const actual = new NFTBuilders.NFTAuctionBuilder()
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

            await expect(
                nftAuctionHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAuctionExpired);
        });

        it("should throw NFTExchangeAuctioneerDoesNotOwnAnyNft, because wallet doesn't have nft property", async () => {
            const actual = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 56,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                nftAuctionHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAuctioneerDoesNotOwnAnyNft);
        });

        it("should not throw, because data is correct", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 56,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftAuctionHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toResolve();
        });

        it("should throw NFTExchangeAuctioneerDoesNotOwnNft, because wallet doesn't own wanted nft", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["e46240714b5db3a23eee60479a623efba4d633d27fe4f03c904b9e219a7fbe60"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 56,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                nftAuctionHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAuctioneerDoesNotOwnNft);
        });

        it("should throw NFTExchangeAuctionAlreadyInProgress", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 56,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const nftExchangeWalletAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            nftExchangeWalletAsset[actual.id] = {
                nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", nftExchangeWalletAsset);

            await expect(
                nftAuctionHandler.throwIfCannotBeApplied(actual, wallet, walletRepository),
            ).rejects.toThrowError(NFTExchangeAuctionAlreadyInProgress);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            const actual = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 56,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftAuctionHandler.throwIfCannotEnterPool(actual)).toResolve();
        });
        it("should throw because two transactions for wanted nft are in pool", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 56,
                    },
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    startAmount: Utils.BigNumber.make("1"),
                    expiration: {
                        blockHeight: 56,
                    },
                })
                .nonce("2")
                .sign(passphrases[0])
                .build();

            await expect(nftAuctionHandler.throwIfCannotEnterPool(actualTwo)).rejects.toThrow();
        });
    });

    describe("apply logic tests", () => {
        describe("applyToSender tests", () => {
            it("should resolve correctly", async () => {
                const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
                nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
                wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

                const actual = new NFTBuilders.NFTAuctionBuilder()
                    .NFTAuctionAsset({
                        nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                        startAmount: Utils.BigNumber.make("1"),
                        expiration: {
                            blockHeight: 56,
                        },
                    })
                    .nonce("1")
                    .sign(passphrases[0])
                    .build();

                await expect(nftAuctionHandler.applyToSender(actual, walletRepository)).toResolve();

                // @ts-ignore
                expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actual.id]).toStrictEqual({
                    nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                    bids: [],
                });

                // @ts-ignore
                expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actual.id)).toStrictEqual(
                    wallet,
                );
            });
        });
    });

    describe("revert logic tests", () => {
        describe("revertForSender tests", () => {
            it("should resolve correctly", async () => {
                const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
                nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
                wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

                const actual = new NFTBuilders.NFTAuctionBuilder()
                    .NFTAuctionAsset({
                        nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                        startAmount: Utils.BigNumber.make("1"),
                        expiration: {
                            blockHeight: 56,
                        },
                    })
                    .nonce("1")
                    .sign(passphrases[0])
                    .build();

                await nftAuctionHandler.applyToSender(actual, walletRepository);

                await expect(nftAuctionHandler.revertForSender(actual, walletRepository)).toResolve();

                // @ts-ignore
                expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actual.id]).toBeUndefined();

                // @ts-ignore
                expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(actual.id)).toBeUndefined();
            });
        });
    });
});