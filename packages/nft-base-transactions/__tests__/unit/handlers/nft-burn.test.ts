import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Enums, Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";
import { Builders as NFTBuilders } from "@protokol/nft-base-crypto";

import { setMockTransaction, setMockTransactions } from "../__mocks__/transaction-repository";
import { buildWallet, initApp } from "../__support__/app";
import {
    NFTBaseBurnCannotBeApplied,
    NFTBaseBurnNFTIsOnAuction,
    NFTBaseBurnWalletDoesntOwnSpecifiedToken,
} from "../../../src/errors";
import { NFTApplicationEvents } from "../../../src/events";
import { INFTCollections, INFTTokens } from "../../../src/interfaces";
import { NFTIndexers } from "../../../src/wallet-indexes";
import { collectionWalletCheck, deregisterTransactions } from "../utils/utils";

let app: Application;

let wallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let nftBurnHandler: TransactionHandler;

let actualCreate: Interfaces.ITransaction;

const nftCollectionAsset: NFTInterfaces.NFTCollectionAsset = {
    name: "Nft card",
    description: "Nft card description",
    maximumSupply: 100,
    jsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            name: {
                type: "string",
                minLength: 3,
            },
            damage: {
                type: "integer",
            },
            health: {
                type: "integer",
            },
            mana: {
                type: "integer",
            },
        },
    },
};

const buildActualBurn = (id: string | undefined, nonce: string = "1") =>
    new NFTBuilders.NFTBurnBuilder()
        .NFTBurnAsset({
            // @ts-ignore
            nftId: id,
        })
        .nonce(nonce)
        .sign(passphrases[0])
        .build();

beforeEach(() => {
    app = initApp();
    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    nftBurnHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(Enums.NFTBaseTransactionTypes.NFTBurn, Enums.NFTBaseTransactionGroup),
        2,
    );
    wallet = buildWallet(app, passphrases[0]);

    walletRepository.index(wallet);

    actualCreate = new NFTBuilders.NFTCreateBuilder()
        .NFTCreateToken({
            collectionId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
            attributes: {
                name: "card name",
                damage: 3,
                health: 2,
                mana: 2,
            },
        })
        .nonce("1")
        .sign(passphrases[0])
        .build();
});

afterEach(() => {
    deregisterTransactions();
});

const prepareWallet = () => {
    const collectionsWallet = wallet.getAttribute<INFTCollections>("nft.base.collections", {});
    collectionsWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {
        currentSupply: 1,
        nftCollectionAsset: nftCollectionAsset,
    };
    wallet.setAttribute("nft.base.collections", collectionsWallet);

    const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
    // @ts-ignore
    tokensWallet[actualCreate.id] = {};
    wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

    walletRepository.index(wallet);
};

const checkApply = () => {
    // @ts-ignore
    expect(wallet.getAttribute<INFTTokens>("nft.base.tokenIds")[actualCreate.id]).toBeUndefined();

    collectionWalletCheck(
        wallet,
        "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
        0,
        nftCollectionAsset,
    );

    expect(
        walletRepository.findByIndex(
            NFTIndexers.CollectionIndexer,
            "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
        ),
    ).toStrictEqual(wallet);
    // @ts-ignore
    expect(walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).get(actualCreate.id)).toBeUndefined();
};

describe("NFT Burn tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            prepareWallet();

            setMockTransactions([actualCreate]);

            const actual = buildActualBurn(actualCreate.id);

            setMockTransaction(actual);

            await expect(nftBurnHandler.bootstrap()).toResolve();
            checkApply();
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = buildActualBurn("05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa");

            await expect(nftBurnHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toResolve();
        });

        it("should throw if nftBurn is undefined", async () => {
            const undefinedTokenInTransaction = { ...actualCreate };
            undefinedTokenInTransaction.data.asset = undefined;

            await expect(
                nftBurnHandler.throwIfCannotBeApplied(undefinedTokenInTransaction, wallet, walletRepository),
            ).toReject();
        });

        it("should throw because wallet doesnt have nft.base", async () => {
            const actual = buildActualBurn("05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa");

            await expect(nftBurnHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTBaseBurnCannotBeApplied,
            );
        });

        it("should throw because wallet doesnt have wanted nft", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["c791bead8ee3a43faaa62d04ba4fce0d5df002f6493a2ad9af72b16bf66ad793"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = buildActualBurn("05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa");

            await expect(nftBurnHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTBaseBurnWalletDoesntOwnSpecifiedToken,
            );
        });

        it("should throw because nft is on auction", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const nftExchangeWalletAsset = wallet.getAttribute("nft.exchange.auctions", {});
            nftExchangeWalletAsset["7259d7a1268e862caa1ea090c1ab4c80f58378ad8fff1de89bd9e24a38ce4674"] = {
                nftIds: ["05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa"],
                bids: [],
            };
            wallet.setAttribute("nft.exchange.auctions", nftExchangeWalletAsset);

            const actual = buildActualBurn("05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa");

            await expect(nftBurnHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).rejects.toThrowError(
                NFTBaseBurnNFTIsOnAuction,
            );
        });

        it("should not throw if cannot find nft", async () => {
            const tokensWallet = wallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa"] = {};
            wallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const nftExchangeWalletAsset = wallet.getAttribute("nft.exchange.auctions", {});
            nftExchangeWalletAsset["7259d7a1268e862caa1ea090c1ab4c80f58378ad8fff1de89bd9e24a38ce4674"] = {
                nftIds: [],
                bids: [],
            };
            wallet.setAttribute("nft.exchange.auctions", nftExchangeWalletAsset);

            const actual = buildActualBurn("05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa");

            await expect(nftBurnHandler.throwIfCannotBeApplied(actual, wallet, walletRepository)).toResolve();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            const actual = buildActualBurn(actualCreate.id);

            await expect(nftBurnHandler.throwIfCannotEnterPool(actual)).toResolve();
        });

        it("should throw because burn is for specified nft is already in pool", async () => {
            prepareWallet();

            setMockTransactions([actualCreate]);

            const actual = buildActualBurn(actualCreate.id);

            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = buildActualBurn(actualCreate.id, "2");
            await expect(nftBurnHandler.throwIfCannotEnterPool(actualTwo)).rejects.toThrow();
        });

        it("should not throw because only burn for other nft is in pool", async () => {
            prepareWallet();

            setMockTransactions([actualCreate]);

            const actual = buildActualBurn(actualCreate.id);

            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = buildActualBurn("05187f38e583cd9ca285bd9ee48af41d04af0f432410ef110ceb87212f4a49aa", "2");
            await expect(nftBurnHandler.throwIfCannotEnterPool(actualTwo)).toResolve();
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actual = buildActualBurn(actualCreate.id);

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftBurnHandler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTApplicationEvents.NFTBurn, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should apply correctly", async () => {
            prepareWallet();

            setMockTransactions([actualCreate]);

            const actual = buildActualBurn(actualCreate.id);

            await expect(nftBurnHandler.apply(actual, walletRepository)).toResolve();
            checkApply();
        });
    });

    describe("revert tests", () => {
        it("should revert correctly", async () => {
            prepareWallet();

            setMockTransactions([actualCreate]);

            const actual = buildActualBurn(actualCreate.id);

            setMockTransaction(actual);

            await nftBurnHandler.apply(actual, walletRepository);
            await expect(nftBurnHandler.revert(actual, walletRepository)).toResolve();
            expect(
                walletRepository.findByIndex(
                    NFTIndexers.CollectionIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(wallet);
            // @ts-ignore
            expect(walletRepository.findByIndex(NFTIndexers.NFTTokenIndexer, actualCreate.id)).toStrictEqual(wallet);
        });

        it("should throw if nftBurn is undefined", async () => {
            prepareWallet();

            setMockTransactions([actualCreate]);

            const actual = buildActualBurn(actualCreate.id);

            setMockTransaction(actual);

            await nftBurnHandler.apply(actual, walletRepository);
            actual.data.asset = undefined;
            await expect(nftBurnHandler.revert(actual, walletRepository)).toReject();
        });

        it("should test revert method with undefined wallet repository", async () => {
            prepareWallet();

            setMockTransactions([actualCreate]);

            const actual = buildActualBurn(actualCreate.id);

            setMockTransaction(actual);

            await nftBurnHandler.apply(actual, walletRepository);
            await expect(nftBurnHandler.revert(actual, undefined)).toResolve();
        });
    });
});
