import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Interfaces as NFTBaseInterfaces } from "@protokol/nft-base-transactions";
import { Builders as NFTBuilders, Enums } from "@protokol/nft-exchange-crypto";

import { FeeType } from "../../../src/enums";
import {
    NFTExchangeAuctionAlreadyInProgress,
    NFTExchangeAuctioneerDoesNotOwnAnyNft,
    NFTExchangeAuctioneerDoesNotOwnNft,
    NFTExchangeAuctionExpired,
    StaticFeeMismatchError,
} from "../../../src/errors";
import { NFTExchangeApplicationEvents } from "../../../src/events";
import { INFTAuctions } from "../../../src/interfaces";
import { NFTExchangeIndexers } from "../../../src/wallet-indexes";
import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { buildAuctionTransaction, deregisterTransactions } from "../utils";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let nftAuctionHandler: Handlers.TransactionHandler;

beforeEach(() => {
    app = initApp();

    wallet = buildWallet(app, passphrases[0]!);

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

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
    deregisterTransactions();
});

describe("NFT Auction tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const actual = buildAuctionTransaction({ blockHeight: 1 });
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });
            await expect(nftAuctionHandler.bootstrap()).toResolve();

            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actual.id!]).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            });

            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(actual.id!)).toStrictEqual(wallet);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4 };

        const mockGetLastBlock = jest.fn();
        Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
        mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

        it("should throw NFTExchangeAuctionExpired", async () => {
            const actual = buildAuctionTransaction({ blockHeight: 1 });

            await expect(nftAuctionHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTExchangeAuctionExpired,
            );
        });

        it("should throw NFTExchangeAuctioneerDoesNotOwnAnyNft, because wallet doesn't have nft property", async () => {
            const actual = buildAuctionTransaction({ blockHeight: 56 });

            await expect(nftAuctionHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTExchangeAuctioneerDoesNotOwnAnyNft,
            );
        });

        it("should not throw, because data is correct", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = buildAuctionTransaction({ blockHeight: 56 });

            await expect(nftAuctionHandler.throwIfCannotBeApplied(actual, wallet)).toResolve();
        });

        it("should throw NFTExchangeAuctioneerDoesNotOwnNft, because wallet doesn't own wanted nft", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["e46240714b5db3a23eee60479a623efba4d633d27fe4f03c904b9e219a7fbe60"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = buildAuctionTransaction({ blockHeight: 56 });

            await expect(nftAuctionHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTExchangeAuctioneerDoesNotOwnNft,
            );
        });

        it("should throw NFTExchangeAuctionAlreadyInProgress", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = buildAuctionTransaction({ blockHeight: 56 });

            const nftExchangeWalletAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            nftExchangeWalletAsset[actual.id!] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", nftExchangeWalletAsset);

            await expect(nftAuctionHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTExchangeAuctionAlreadyInProgress,
            );
        });

        it("should not throw if there is no auction for selected ntf", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = buildAuctionTransaction({ blockHeight: 56 });

            const nftExchangeWalletAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            nftExchangeWalletAsset[actual.id!] = {
                nftIds: [],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", nftExchangeWalletAsset);

            await expect(nftAuctionHandler.throwIfCannotBeApplied(actual, wallet)).toResolve();
        });

        it("should throw if nftAuction is undefined", async () => {
            const actual = buildAuctionTransaction({ blockHeight: 56 });
            actual.data.asset = undefined;

            await expect(nftAuctionHandler.throwIfCannotBeApplied(actual, wallet)).toReject();
        });

        it("should throw StaticFeeMismatchError", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = new NFTBuilders.NFTAuctionBuilder()
                .NFTAuctionAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    expiration: { blockHeight: 56 },
                    startAmount: Utils.BigNumber.make(1),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .fee("1")
                .build();

            await expect(nftAuctionHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                StaticFeeMismatchError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            const actual = buildAuctionTransaction({ blockHeight: 56 });

            await expect(nftAuctionHandler.throwIfCannotEnterPool(actual)).toResolve();
        });

        it("should throw because two transactions for wanted nft are in pool", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = buildAuctionTransaction({ blockHeight: 56 });
            await app.get<Mempool>(Container.Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = buildAuctionTransaction({ blockHeight: 56, nonce: "2" });

            await expect(nftAuctionHandler.throwIfCannotEnterPool(actualTwo)).rejects.toThrow();
        });

        it("should not throw because only auction for other nft is in pool", async () => {
            const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
            nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

            const actual = buildAuctionTransaction({ blockHeight: 56 });
            await app.get<Mempool>(Container.Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = buildAuctionTransaction({
                blockHeight: 56,
                nonce: "2",
                nftIds: ["e46240714b5db3a23eee60479a623efba4d633d27fe4f03c904b9e219a7fbe60"],
            });

            await expect(nftAuctionHandler.throwIfCannotEnterPool(actualTwo)).toResolve();
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actual = buildAuctionTransaction({ blockHeight: 56 });

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Container.Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftAuctionHandler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTExchangeApplicationEvents.NFTAuction, expect.anything());
        });
    });
    describe("apply logic tests", () => {
        describe("applyToSender tests", () => {
            it("should resolve correctly", async () => {
                const nftBaseWalletAsset = wallet.getAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", {});
                nftBaseWalletAsset["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
                wallet.setAttribute<NFTBaseInterfaces.INFTTokens>("nft.base.tokenIds", nftBaseWalletAsset);

                const actual = buildAuctionTransaction({ blockHeight: 56 });

                await expect(nftAuctionHandler.applyToSender(actual)).toResolve();

                expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actual.id!]).toStrictEqual({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    bids: [],
                });

                expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actual.id!)).toStrictEqual(
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

                const actual = buildAuctionTransaction({ blockHeight: 56 });

                await nftAuctionHandler.apply(actual);

                await expect(nftAuctionHandler.revert(actual)).toResolve();

                expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actual.id!]).toBeUndefined();

                expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(actual.id!)).toBeUndefined();
            });
        });
    });

    describe("fee tests", () => {
        let actual;
        beforeEach(() => {
            actual = buildAuctionTransaction({ blockHeight: 56 });
        });
        it("should test dynamic fee", async () => {
            expect(
                nftAuctionHandler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.make((Math.round(actual.serialized.length / 2) + 150) * 3));
        });

        it("should test static fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );
            expect(
                nftAuctionHandler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.make(nftAuctionHandler.getConstructor().staticFee()));
        });

        it("should test none fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.None,
            );
            expect(
                nftAuctionHandler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.ZERO);
        });
    });
});
