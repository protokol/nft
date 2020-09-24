import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import {
    NFTBaseTransferCannotBeApplied,
    NFTBaseTransferNFTIsOnAuction,
    NFTBaseTransferWalletDoesntOwnSpecifiedNftToken,
} from "../errors";
import { NFTApplicationEvents } from "../events";
import { INFTTokens } from "../interfaces";
import { NFTIndexers } from "../wallet-indexes";
import { NFTBaseTransactionHandler } from "./nft-base-handler";
import { NFTCreateHandler } from "./nft-create";

@Container.injectable()
export class NFTTransferHandler extends NFTBaseTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

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

    public async bootstrap(): Promise<void> {
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.asset?.nftTransfer);
            AppUtils.assert.defined<string>(transaction.senderPublicKey);

            const recipientWallet = this.walletRepository.findByAddress(transaction.asset.nftTransfer.recipientId);
            const senderWallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.asset.nftTransfer;

            const senderTokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            for (const token of nftTransferAsset.nftIds) {
                delete senderTokensWallet[token];
                this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).forget(token);
            }

            senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", senderTokensWallet);

            const recipientTokensWallet = recipientWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
            for (const token of nftTransferAsset.nftIds) {
                recipientTokensWallet[token] = {};
                this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).set(token, recipientWallet);
            }
            recipientWallet.setAttribute<INFTTokens>("nft.base.tokenIds", recipientTokensWallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTApplicationEvents.NFTTransfer, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
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
                if (auctionsWalletAsset.hasOwnProperty(auction) && auctionsWalletAsset[auction].nftIds.includes(nft)) {
                    throw new NFTBaseTransferNFTIsOnAuction();
                }
            }
        }
        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const nftIds: string = transaction.data.asset!.nftTransfer.nftIds;
        const hasNft: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => {
                for (const nftId of nftIds) {
                    if (t.data.asset!.nftTransfer.nftIds.includes(nftId)) {
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
            );
        }
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        // Line is already checked inside throwIfCannotBeApplied run by super.applyToSender method
        //AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.data.asset?.nftTransfer);
        AppUtils.assert.defined<string>(transaction.data.id);

        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.data.asset!.nftTransfer;

        const senderTokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        for (const token of nftTransferAsset.nftIds) {
            delete senderTokensWallet[token];
            this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).forget(token);
        }
        senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", senderTokensWallet);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.data.asset?.nftTransfer);
        AppUtils.assert.defined<string>(transaction.data.id);

        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.data.asset.nftTransfer;

        const senderTokensWallet = senderWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        for (const token of nftTransferAsset.nftIds) {
            senderTokensWallet[token] = {};
            this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).set(token, senderWallet);
        }
        senderWallet.setAttribute<INFTTokens>("nft.base.tokenIds", senderTokensWallet);
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.data.asset?.nftTransfer);

        const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.data.asset.nftTransfer;

        const recipientWallet = this.walletRepository.findByAddress(nftTransferAsset.recipientId);

        const recipientTokensWallet = recipientWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});
        for (const token of nftTransferAsset.nftIds) {
            recipientTokensWallet[token] = {};
            this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).set(token, recipientWallet);
        }
        recipientWallet.setAttribute<INFTTokens>("nft.base.tokenIds", recipientTokensWallet);
    }

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTTransferAsset>(transaction.data.asset?.nftTransfer);

        const nftTransferAsset: NFTInterfaces.NFTTransferAsset = transaction.data.asset.nftTransfer;

        const recipientWallet = this.walletRepository.findByAddress(nftTransferAsset.recipientId);

        const recipientTokensWallet = recipientWallet.getAttribute<INFTTokens>("nft.base.tokenIds", {});

        for (const token of nftTransferAsset.nftIds) {
            delete recipientTokensWallet[token];
            // already get overwritten by revertForSender logic
            // this.walletRepository.getIndex(NFTIndexers.NFTTokenIndexer).forget(token);
        }
        recipientWallet.setAttribute<INFTTokens>("nft.base.tokenIds", recipientTokensWallet);
    }
}
