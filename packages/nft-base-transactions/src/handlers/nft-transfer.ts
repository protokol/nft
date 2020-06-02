import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import {
    NFTBaseTransferCannotBeApplied,
    NFTBaseTransferNFTIsOnAuction,
    NFTBaseTransferWalletDoesntOwnSpecifiedNftToken,
} from "../errors";
import { NFTApplicationEvents } from "../events";
import { INFTTokens } from "../interfaces";
import { NFTIndexers } from "../wallet-indexes";
import { NFTCreateHandler } from "./nft-create";

@Container.injectable()
export class NFTTransferHandler extends Handlers.TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTTransferTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NFTCreateHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["nft.exchange.auctions"];
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const recipientWallet: Contracts.State.Wallet = this.walletRepository.findByAddress(
                transaction.asset.nftTransfer.recipientId,
            );

            const senderWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                transaction.senderPublicKey,
            );

            const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.asset.nftTransfer;

            const senderTokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            for (const token of nftTransferAsset.nftIds) {
                delete senderTokensWallet[token];
                this.walletRepository.forgetByIndex(NFTIndexers.NFTTokenIndexer, token);
            }
            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", senderTokensWallet);

            const recipientTokensWallet = recipientWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            for (const token of nftTransferAsset.nftIds) {
                recipientTokensWallet[token] = {};
            }
            recipientWallet.setAttribute<INFTTokens>("nft.base.tokenIds", recipientTokensWallet);

            this.walletRepository.index(senderWallet);
            this.walletRepository.index(recipientWallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTApplicationEvents.NFTTransfer, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.data.asset?.nftTransfer);

        if (!sender.hasAttribute("nft.base.tokenIds")) {
            throw new NFTBaseTransferCannotBeApplied();
        }

        const senderWalletAsset = sender.getAttribute<INFTTokens>("nft.base.tokenIds");

        for (const nft of transaction.data.asset.nftTransfer.nftIds) {
            if (!senderWalletAsset[nft]) {
                throw new NFTBaseTransferWalletDoesntOwnSpecifiedNftToken();
            }
        }

        const auctionsWalletAsset = sender.getAttribute("nft.exchange.auctions", {});

        for (const auction of Object.keys(auctionsWalletAsset)) {
            for (const nft of transaction.data.asset.nftTransfer.nftIds) {
                if (auctionsWalletAsset.hasOwnProperty(auction) && auctionsWalletAsset[auction].nftId === nft) {
                    throw new NFTBaseTransferNFTIsOnAuction();
                }
            }
        }

        return super.throwIfCannotBeApplied(transaction, sender, customWalletRepository);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const nftIds: string = transaction.data.asset!.nftTransfer.nftIds;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => {
                for (const nftId of nftIds) {
                    if (t.data.asset?.nftTransfer.nftIds.includes(nftId)) {
                        return true;
                    }
                }
                return false;
            })
            .has();

        if (hasNft) {
            throw new Contracts.TransactionPool.PoolError(
                `NFT transfer, nftId for transfer already in pool`,
                "ERR_PENDING",
                transaction,
            );
        }
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.data.asset?.nftTransfer);
        AppUtils.assert.defined<string>(transaction.data.id);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const senderWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.data.asset.nftTransfer;

        const senderTokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        for (const token of nftTransferAsset.nftIds) {
            delete senderTokensWallet[token];
            walletRepository.forgetByIndex(NFTIndexers.NFTTokenIndexer, token);
        }
        senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", senderTokensWallet);

        walletRepository.index(senderWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.data.asset?.nftTransfer);
        AppUtils.assert.defined<string>(transaction.data.id);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const senderWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.data.asset.nftTransfer;

        const senderTokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        for (const token of nftTransferAsset.nftIds) {
            senderTokensWallet[token] = {};
        }
        senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", senderTokensWallet);
        walletRepository.index(senderWallet);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.data.asset?.nftTransfer);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.data.asset.nftTransfer;

        const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(nftTransferAsset.recipientId);

        const recipientTokensWallet = recipientWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        for (const token of nftTransferAsset.nftIds) {
            recipientTokensWallet[token] = {};
        }
        recipientWallet.setAttribute<INFTTokens>("nft.base.tokenIds", recipientTokensWallet);
        walletRepository.index(recipientWallet);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.data.asset?.nftTransfer);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.data.asset.nftTransfer;

        const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(nftTransferAsset.recipientId);

        const recipientTokensWallet = recipientWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});

        for (const token of nftTransferAsset.nftIds) {
            delete recipientTokensWallet[token];
        }
        recipientWallet.setAttribute<INFTTokens>("nft.base.tokenIds", recipientTokensWallet);

        walletRepository.index(recipientWallet);
    }
}
