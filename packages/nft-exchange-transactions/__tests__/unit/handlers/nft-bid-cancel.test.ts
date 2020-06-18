import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Builders as NFTBuilders } from "@protokol/nft-exchange-crypto";

import { setMockTransaction, setMockTransactions } from "../__mocks__/transaction-repository";
import { buildWallet, initApp } from "../__support__/app";
import {
    NFTExchangeBidCancelAuctionCanceledOrAccepted,
    NFTExchangeBidCancelBidCanceled,
    NFTExchangeBidCancelBidDoesNotExists,
    NFTExchangeBidCancelCannotCancelOtherBids,
} from "../../../src/errors";
import { NFTExchangeApplicationEvents } from "../../../src/events";
import { INFTAuctions } from "../../../src/interfaces";
import { NFTExchangeIndexers } from "../../../src/wallet-indexes";
import { buildAuctionTransaction, buildBidTransaction, deregisterTransactions } from "../utils";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftBidCancelHandler: TransactionHandler;

beforeEach(() => {
    app = initApp();

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
    deregisterTransactions();
});

describe("NFT Bid Cancel tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 4 });

            const actualBid = buildBidTransaction({ auctionId: actualAuction.id! });
            setMockTransactions([actualBid, actualAuction]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);

            wallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.make("1"));

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
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            });
            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id!)).toBeUndefined();

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );

            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id)).toStrictEqual(
                wallet,
            );
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should throw if nftBidCancel is undefined", async () => {
            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    bidId: "e5ff17de47e33551c7991b72921201b55e1362ef897542e0fd7a038cd262b971",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();
            actual.data.asset = undefined;

            await expect(nftBidCancelHandler.throwIfCannotBeApplied(actual, wallet)).toReject();
        });

        it("should throw NFTExchangeBidCancelCannotCancelOtherBids if trying to cancel other user's bid", async () => {
            const bid = buildBidTransaction({
                auctionId: "e5ff17de47e33551c7991b72921201b55e1362ef897542e0fd7a038cd262b971",
                passphrase: passphrases[1],
            });

            setMockTransactions([bid]);
            const cancelBid = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    bidId: bid.id!,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftBidCancelHandler.throwIfCannotBeApplied(cancelBid, wallet)).rejects.toThrowError(
                NFTExchangeBidCancelCannotCancelOtherBids,
            );
        });

        it("should throw NFTExchangeBidCancelBidDoesNotExists", async () => {
            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    bidId: "e5ff17de47e33551c7991b72921201b55e1362ef897542e0fd7a038cd262b971",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftBidCancelHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTExchangeBidCancelBidDoesNotExists,
            );
        });

        it("should throw NFTExchangeBidCancelAuctionCanceledOrAccepted", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 4 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id! });

            setMockTransactions([actualAuction, actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["703b87044730ee74862ca513c6d86f69e97d43a5ac8a3f68a1b18d9ac793e200"] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id!],
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

            await expect(nftBidCancelHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTExchangeBidCancelAuctionCanceledOrAccepted,
            );
        });

        it("should throw NFTExchangeBidCancelBidCanceled", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 4 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id! });

            setMockTransactions([actualAuction, actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
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

            await expect(nftBidCancelHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTExchangeBidCancelBidCanceled,
            );
        });

        it("should not throw ", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 4 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id! });

            setMockTransactions([actualAuction, actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
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

            await expect(nftBidCancelHandler.throwIfCannotBeApplied(actual, wallet)).toResolve();
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
            const actualAuction = buildAuctionTransaction({ blockHeight: 4 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id! });

            setMockTransactions([actualAuction, actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
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

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    bidId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftBidCancelHandler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTExchangeApplicationEvents.NFTCancelBid, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should apply correctly", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 4 });
            const actualBid = buildBidTransaction({ auctionId: actualAuction.id! });

            setMockTransactions([actualBid, actualAuction]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            // @ts-ignore
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);
            wallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.make("1"));

            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(nftBidCancelHandler.applyToSender(actual)).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            });

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );

            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id!)).toBeUndefined();
            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id)).toStrictEqual(
                wallet,
            );
        });
    });
    describe("revert tests", () => {
        let actualAuction, actualBid;
        beforeEach(() => {
            const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4 };

            const mockGetLastBlock = jest.fn();
            StateStore.prototype.getLastBlock = mockGetLastBlock;
            mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

            actualAuction = buildAuctionTransaction({ blockHeight: 4 });
            actualBid = buildBidTransaction({ auctionId: actualAuction.id });

            setMockTransactions([actualBid, actualAuction]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                // @ts-ignore
                bids: [actualBid.id],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.index(wallet);
            wallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.make("1"));
        });

        it("should revert correctly", async () => {
            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await nftBidCancelHandler.apply(actual);
            await expect(nftBidCancelHandler.revert(actual)).toResolve();

            // @ts-ignore
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id]).toStrictEqual({
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [actualBid.id],
            });

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.make("1"),
            );

            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id)).toStrictEqual(wallet);
            // @ts-ignore
            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id)).toStrictEqual(
                wallet,
            );
        });

        it("should throw if nftBidCancel is undefined", async () => {
            const actual = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    // @ts-ignore
                    bidId: actualBid.id,
                })
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await nftBidCancelHandler.apply(actual);
            actual.data.asset = undefined;
            await expect(nftBidCancelHandler.revert(actual)).toReject();
        });
    });
});
