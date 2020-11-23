import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Transactions } from "@arkecosystem/crypto";
import { Builders, Enums } from "@protokol/nft-base-crypto";

import {
    NFTBaseTransferCannotBeApplied,
    NFTBaseTransferNFTIsOnAuction,
    NFTBaseTransferWalletDoesntOwnSpecifiedNftToken,
} from "../../../src/errors";
import { NFTApplicationEvents } from "../../../src/events";
import { INFTTokens } from "../../../src/interfaces";
import { NFTIndexers } from "../../../src/wallet-indexes";
import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { deregisterTransactions } from "../utils/utils";

let app: Application;

let senderWallet: Contracts.State.Wallet;
let recipientWallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let nftTransferHandler: Handlers.TransactionHandler;

beforeEach(() => {
    app = initApp();

    senderWallet = buildWallet(app, passphrases[0]!);
    recipientWallet = buildWallet(app, passphrases[1]!);

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

    nftTransferHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NFTBaseTransactionTypes.NFTTransfer,
            Enums.NFTBaseTransactionGroup,
        ),
        2,
    );
    walletRepository.index(senderWallet);
    walletRepository.index(recipientWallet);
});

afterEach(() => {
    deregisterTransactions();
});

describe("NFT Transfer tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[1]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });
            await expect(nftTransferHandler.bootstrap()).toResolve();

            expect(
                senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeUndefined();

            expect(
                recipientWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeObject();

            expect(
                walletRepository.findByIndex(
                    NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(recipientWallet);
        });

        it("should test bootstrap resend to the same wallet", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });

            await expect(nftTransferHandler.bootstrap()).toResolve();

            expect(
                senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeObject();

            expect(
                walletRepository.findByIndex(
                    NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(senderWallet);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftTransferHandler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if nftTransfer is undefined", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            actual.data.asset = undefined;

            await expect(nftTransferHandler.throwIfCannotBeApplied(actual, senderWallet)).toReject();
        });

        it("should throw NFTBaseTransferCannotBeApplied", async () => {
            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["9701560ba877d5552303cb54d10d461a0836a324649608a0a56c885b631b0434"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftTransferHandler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                NFTBaseTransferCannotBeApplied,
            );
        });

        it("should throw NFTBaseTransferWalletDoesntOwnSpecifiedNftToken", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["c791bead8ee3a43faaa62d04ba4fce0d5df002f6493a2ad9af72b16bf66ad793"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            await expect(nftTransferHandler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                NFTBaseTransferWalletDoesntOwnSpecifiedNftToken,
            );
        });

        it("should throw NFTBaseTransferNFTIsOnAuction", async () => {
            const nftExchangeWalletAsset = senderWallet.getAttribute("nft.exchange.auctions", {});
            nftExchangeWalletAsset["7259d7a1268e862caa1ea090c1ab4c80f58378ad8fff1de89bd9e24a38ce4674"] = {
                nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                bids: [],
            };
            senderWallet.setAttribute("nft.exchange.auctions", nftExchangeWalletAsset);
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            await expect(nftTransferHandler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                NFTBaseTransferNFTIsOnAuction,
            );
        });

        it("should not throw if cannot find nft in nftIds", async () => {
            const nftExchangeWalletAsset = senderWallet.getAttribute("nft.exchange.auctions", {});
            nftExchangeWalletAsset["7259d7a1268e862caa1ea090c1ab4c80f58378ad8fff1de89bd9e24a38ce4674"] = {
                nftIds: [],
                bids: [],
            };
            senderWallet.setAttribute("nft.exchange.auctions", nftExchangeWalletAsset);
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            await expect(nftTransferHandler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            await expect(nftTransferHandler.throwIfCannotEnterPool(actual)).toResolve();
        });

        it("should not throw because only transaction of other nft is in pool", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            await app.get<Mempool>(Container.Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e62"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("2")
                .sign(passphrases[0]!)
                .build();
            await expect(nftTransferHandler.throwIfCannotEnterPool(actualTwo)).toResolve();
        });

        it("should throw because transaction of specified nft is already in pool", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            await app.get<Mempool>(Container.Identifiers.TransactionPoolMempool).addTransaction(actual);

            const actualTwo = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]!),
                })
                .nonce("2")
                .sign(passphrases[0]!)
                .build();
            await expect(nftTransferHandler.throwIfCannotEnterPool(actualTwo)).rejects.toThrow();
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: recipientWallet.address,
                })
                .nonce("3")
                .sign(passphrases[0]!)
                .build();

            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Container.Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            nftTransferHandler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NFTApplicationEvents.NFTTransfer, expect.anything());
        });
    });

    describe("apply test", () => {
        it("should test apply logic", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: recipientWallet.address,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftTransferHandler.apply(actual)).toResolve();

            expect(
                senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeUndefined();

            expect(
                recipientWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeObject();

            expect(
                walletRepository.findByIndex(
                    NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(recipientWallet);
        });

        it("should test apply logic for resend", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: senderWallet.address,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await expect(nftTransferHandler.apply(actual)).toResolve();

            expect(
                senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeObject();

            expect(
                walletRepository.findByIndex(
                    NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(senderWallet);
        });

        it("should throw if nftTransfer is undefined", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: senderWallet.address,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();
            actual.data.asset = undefined;

            await expect(nftTransferHandler.applyToSender(actual)).toReject();
            await expect(nftTransferHandler.applyToRecipient(actual)).toReject();
        });
    });

    describe("revert tests", () => {
        it("should test revert logic", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
            walletRepository.index(senderWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: recipientWallet.address,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await nftTransferHandler.apply(actual);
            await expect(nftTransferHandler.revert(actual)).toResolve();

            expect(
                senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeObject();

            expect(
                recipientWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeUndefined();

            expect(
                walletRepository.findByIndex(
                    NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(senderWallet);
        });

        it("should test revert logic - resend", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
            walletRepository.index(senderWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: recipientWallet.address,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await nftTransferHandler.apply(actual);
            await expect(nftTransferHandler.revert(actual)).toResolve();

            expect(
                senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds")[
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
                ],
            ).toBeObject();
            expect(
                walletRepository.findByIndex(
                    NFTIndexers.NFTTokenIndexer,
                    "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                ),
            ).toStrictEqual(senderWallet);
        });

        it("should throw if nftTransfer is undefined", async () => {
            const tokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            tokensWallet["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"] = {};
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", tokensWallet);
            walletRepository.index(senderWallet);

            const actual = new Builders.NFTTransferBuilder()
                .NFTTransferAsset({
                    nftIds: ["8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"],
                    recipientId: recipientWallet.address,
                })
                .nonce("1")
                .sign(passphrases[0]!)
                .build();

            await nftTransferHandler.apply(actual);
            actual.data.asset = undefined;
            await expect(nftTransferHandler.revertForSender(actual)).toReject();
            await expect(nftTransferHandler.revertForRecipient(actual)).toReject();
        });
    });
});
