import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Indexers } from "@protokol/nft-base-transactions";
import { Builders as NFTBuilders, Enums } from "@protokol/nft-exchange-crypto";

import { NFTExchangeAuctionCancelCannotCancel } from "../../../src/errors";
import { NFTExchangeApplicationEvents } from "../../../src/events";
import { INFTAuctions } from "../../../src/interfaces";
import { NFTExchangeIndexers } from "../../../src/wallet-indexes";
import { setMockFindByIds, setMockTransactions } from "../__mocks__/transaction-repository";
import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { buildAuctionTransaction, buildBidTransaction, deregisterTransactions } from "../utils";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let nftCancelSellHandler: Handlers.TransactionHandler;

let actualBid: Interfaces.ITransaction;

const auctionId = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";

beforeEach(() => {
    app = initApp();

    wallet = buildWallet(app, passphrases[0]!);

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

    nftCancelSellHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTTransactionTypes.NFTAuctionCancel,
            Enums.NFTExchangeTransactionsTypeGroup,
        ),
        2,
    );
    walletRepository.index(wallet);

    actualBid = buildBidTransaction({
        auctionId,
        bidAmount: 100,
    });
});

afterEach(() => {
    deregisterTransactions();
});

describe("NFT Auction Cancel tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[auctionId] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });
            await expect(nftCancelSellHandler.bootstrap()).toResolve();

            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[auctionId]).toBeUndefined();

            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(auctionId)).toBeUndefined();
        });

        it("should test bootstrap method with bids", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[auctionId] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [actualBid.id!],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            wallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.make(100));
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);
            setMockTransactions([actualBid]);
            setMockFindByIds([actualBid]);

            await expect(nftCancelSellHandler.bootstrap()).toResolve();

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654410"));

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );

            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[auctionId]).toBeUndefined();

            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(auctionId)).toBeUndefined();

            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id!)).toBeUndefined();
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[auctionId] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftCancelSellHandler.throwIfCannotBeApplied(actual, wallet)).toResolve();
        });

        it("should throw if nftAuctionCancel is undefined", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            actual.data.asset = undefined;

            await expect(nftCancelSellHandler.throwIfCannotBeApplied(actual, wallet)).toReject();
        });

        it("should throw NFTExchangeAuctionCancelCannotCancel, because wallet doesn't own nft.exchange", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftCancelSellHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTExchangeAuctionCancelCannotCancel,
            );
        });

        it("should throw NFTExchangeAuctionCancelCannotCancel, because wallet doesn't own wanted auction", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset["fa52e0215b2567114ae18154d3509c8e04fb28db4cf4217175ebb0b737fc24d6"] = {
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftCancelSellHandler.throwIfCannotBeApplied(actual, wallet)).rejects.toThrowError(
                NFTExchangeAuctionCancelCannotCancel,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftCancelSellHandler.throwIfCannotEnterPool(actual)).toResolve();
        });

        it("should throw because transaction for cancel is already in pool", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[auctionId] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);
            walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            await app.get<Mempool>(Container.Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("2")
                .sign(passphrases[0]!)
                .build();

            await expect(nftCancelSellHandler.throwIfCannotEnterPool(actualTwo)).rejects.toThrowError();
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Container.Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftCancelSellHandler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTExchangeApplicationEvents.NFTCancelAuction, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should apply correctly", async () => {
            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[auctionId] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);
            walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            await expect(nftCancelSellHandler.applyToSender(actual)).toResolve();

            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[auctionId]).toBeUndefined();

            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(auctionId)).toBeUndefined();
        });

        it("should apply correctly with bids", async () => {
            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({ auctionId })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            setMockTransactions([actualBid]);
            setMockFindByIds([actualBid]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[auctionId] = {
                nftIds: ["cd853bc1e0f4d43397df80bb6fb474a9473345cbcf409efa6d88952491efde4d"],
                bids: [actualBid.id!],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            wallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.make(100));
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);
            walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);
            walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).index(wallet);

            await expect(nftCancelSellHandler.applyToSender(actual)).toResolve();

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7027654410"));

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );

            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[auctionId]).toBeUndefined();

            expect(walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).get(auctionId)).toBeUndefined();

            expect(walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).get(actualBid.id!)).toBeUndefined();
        });
    });

    describe("revert tests", () => {
        it("should revert correctly", async () => {
            const actualAuction = buildAuctionTransaction({
                blockHeight: 4,
                startAmount: 100,
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
            });
            setMockTransactions([actualAuction]);
            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);
            transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actualBid.data);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id!] = {
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);
            walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: actualAuction.id!,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await nftCancelSellHandler.applyToSender(actual);

            await expect(nftCancelSellHandler.revertForSender(actual)).toResolve();

            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id!]).toStrictEqual({
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [],
            });

            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id!)).toStrictEqual(
                wallet,
            );
        });

        it("should revert correctly with bids", async () => {
            const actualAuction = buildAuctionTransaction({
                blockHeight: 4,
                startAmount: 100,
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
            });

            setMockTransactions([actualAuction, actualBid]);
            setMockFindByIds([actualBid]);

            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id!] = {
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [actualBid.id!],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);
            walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);
            walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: actualAuction.id!,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await nftCancelSellHandler.apply(actual);

            await expect(nftCancelSellHandler.revert(actual)).toResolve();

            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id!]).toStrictEqual({
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [actualBid.id!],
            });

            expect(wallet.balance).toStrictEqual(Utils.BigNumber.make("7527654310"));

            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.ZERO,
            );

            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id!)).toStrictEqual(
                wallet,
            );

            expect(walletRepository.findByIndex(NFTExchangeIndexers.BidIndexer, actualBid.id!)).toStrictEqual(wallet);
        });

        it("should revert correctly with bids and cancel bids", async () => {
            const actualAuction = buildAuctionTransaction({
                blockHeight: 4,
                startAmount: 100,
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
            });

            const actualCancelBid = new NFTBuilders.NFTBidCancelBuilder()
                .NFTBidCancelAsset({
                    bidId: actualBid.id!,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            setMockTransactions([actualAuction, actualBid, actualCancelBid]);
            setMockFindByIds([actualBid]);

            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([actualBid.data]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            const auctionAsset = {
                nftIds: ["3e1a4b362282b4113d717632b92c939cf689a9919db77c723efba84c6ec0330c"],
                bids: [actualBid.id!],
            };
            auctionsAsset[actualAuction.id!] = auctionAsset;
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            wallet.setAttribute<Utils.BigNumber>("nft.exchange.lockedBalance", Utils.BigNumber.make(110));
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);
            walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);
            walletRepository.getIndex(NFTExchangeIndexers.BidIndexer).index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: actualAuction.id!,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await nftCancelSellHandler.applyToSender(actual);

            // auction and bids should be canceled after apply
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id!]).toBeUndefined();
            // locked balanced should be decreased after canceling auction with bids
            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.make(10),
            );

            await expect(nftCancelSellHandler.revertForSender(actual)).toResolve();

            // auction and bids should be restored after revert
            expect(wallet.getAttribute<INFTAuctions>("nft.exchange.auctions")[actualAuction.id!]).toStrictEqual(
                auctionAsset,
            );
            // locked balance should be restored after revert
            expect(wallet.getAttribute<Utils.BigNumber>("nft.exchange.lockedBalance")).toStrictEqual(
                Utils.BigNumber.make(110),
            );

            expect(walletRepository.findByIndex(NFTExchangeIndexers.AuctionIndexer, actualAuction.id!)).toStrictEqual(
                wallet,
            );
        });

        it("should throw if nftAuctionCancel is undefined", async () => {
            const actualAuction = buildAuctionTransaction({ blockHeight: 4, startAmount: 100 });
            setMockTransactions([actualAuction]);

            const auctionsAsset = wallet.getAttribute<INFTAuctions>("nft.exchange.auctions", {});
            auctionsAsset[actualAuction.id!] = {
                nftIds: [auctionId],
                bids: [],
            };
            wallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionsAsset);
            walletRepository.getIndex(NFTExchangeIndexers.AuctionIndexer).index(wallet);
            walletRepository.getIndex(Indexers.NFTIndexers.NFTTokenIndexer).index(wallet);

            const actual = new NFTBuilders.NFTAuctionCancelBuilder()
                .NFTAuctionCancelAsset({
                    auctionId: actualAuction.id!,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await nftCancelSellHandler.applyToSender(actual);
            actual.data.asset = undefined;
            await expect(nftCancelSellHandler.revertForSender(actual)).toReject();
        });
    });
});
