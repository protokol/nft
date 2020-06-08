import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Enums, Interfaces as NFTInterfaces, Transactions as NFTTransactions } from "@protokol/nft-exchange-crypto";

import {
    NFTExchangeBidAuctionCanceledOrAccepted,
    NFTExchangeBidAuctionDoesNotExists,
    NFTExchangeBidAuctionExpired,
    NFTExchangeBidNotEnoughFounds,
    NFTExchangeBidStartAmountToLow,
} from "../errors";
import { NFTExchangeApplicationEvents } from "../events";
import { INFTAuctions } from "../interfaces";
import { NFTExchangeIndexers } from "../wallet-indexes";
import { NFTAuctionHandler } from "./nft-auction";
import { NFTAuctionCancelHandler } from "./nft-auction-cancel";
import { NFTExchangeHandler } from "./nft-exchange-handler";

@Container.injectable()
export class NFTBidHandler extends NFTExchangeHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return NFTTransactions.NFTBidTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NFTAuctionHandler, NFTAuctionCancelHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const nftBidAsset: NFTInterfaces.NFTBidAsset = transaction.asset.nftBid;

            wallet.balance = wallet.balance.minus(nftBidAsset.bidAmount);

            const auctionTransaction: Models.Transaction = await this.transactionRepository.findById(
                nftBidAsset.auctionId,
            );
            const auctionWallet = this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

            const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
            auctionWalletAsset[nftBidAsset.auctionId].bids.push(transaction.id);
            auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

            this.walletRepository.index(auctionWallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NFTExchangeApplicationEvents.NFTBid, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        AppUtils.assert.defined<NFTInterfaces.NFTBidAsset>(transaction.data.asset?.nftBid);
        const nftBid: NFTInterfaces.NFTBidAsset = transaction.data.asset.nftBid;

        const auctionTransaction = await this.transactionRepository.findById(nftBid.auctionId);
        if (
            !auctionTransaction ||
            auctionTransaction.typeGroup !== Enums.NFTExchangeTransactionsTypeGroup ||
            auctionTransaction.type !== Enums.NFTTransactionTypes.NFTAuction
        ) {
            throw new NFTExchangeBidAuctionDoesNotExists();
        }

        const auctionWallet = await this.walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);
        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        if (!auctionWalletAsset[auctionTransaction.id]) {
            throw new NFTExchangeBidAuctionCanceledOrAccepted();
        }

        const lastBlock: Interfaces.IBlock = this.app.get<any>(Container.Identifiers.StateStore).getLastBlock();
        if (lastBlock.data.height >= auctionTransaction.asset.nftAuction.expiration.blockHeight) {
            throw new NFTExchangeBidAuctionExpired();
        }

        if (sender.balance.isLessThan(nftBid.bidAmount)) {
            throw new NFTExchangeBidNotEnoughFounds();
        }

        const nftAuctionAsset: NFTInterfaces.NFTAuctionAsset = auctionTransaction.asset.nftAuction;
        if (Utils.BigNumber.make(nftAuctionAsset.startAmount).isGreaterThan(nftBid.bidAmount)) {
            throw new NFTExchangeBidStartAmountToLow();
        }

        return super.throwIfCannotBeApplied(transaction, sender, customWalletRepository);
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, customWalletRepository);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTBidAsset>(transaction.data.asset?.nftBid);
        AppUtils.assert.defined<string>(transaction.data.id);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const nftBidAsset: NFTInterfaces.NFTBidAsset = transaction.data.asset.nftBid;

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.minus(nftBidAsset.bidAmount);

        const auctionTransaction: Models.Transaction = await this.transactionRepository.findById(nftBidAsset.auctionId);

        const auctionWallet = walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletAsset[nftBidAsset.auctionId].bids.push(transaction.data.id);
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        walletRepository.index(auctionWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NFTInterfaces.NFTBidAsset>(transaction.data.asset?.nftBid);
        AppUtils.assert.defined<string>(transaction.data.id);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        const nftBidAsset: NFTInterfaces.NFTBidAsset = transaction.data.asset.nftBid;

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.plus(nftBidAsset.bidAmount);

        const auctionTransaction: Models.Transaction = await this.transactionRepository.findById(nftBidAsset.auctionId);

        const auctionWallet = walletRepository.findByPublicKey(auctionTransaction.senderPublicKey);

        const auctionWalletAsset = auctionWallet.getAttribute<INFTAuctions>("nft.exchange.auctions");
        auctionWalletAsset[nftBidAsset.auctionId].bids = auctionWalletAsset[nftBidAsset.auctionId].bids.filter(
            (bid) => bid !== transaction.data.id,
        );
        auctionWallet.setAttribute<INFTAuctions>("nft.exchange.auctions", auctionWalletAsset);

        walletRepository.forgetByIndex(NFTExchangeIndexers.BidIndexer, transaction.data.id);
        walletRepository.index(auctionWallet);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
