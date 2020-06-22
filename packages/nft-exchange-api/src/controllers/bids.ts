import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Indexers } from "@protokol/nft-exchange-transactions";

import { BidResource } from "../resources/bids";
import { BidCancelResource } from "../resources/bids-cancel";
import { WalletResource } from "../resources/wallets";

@Container.injectable()
export class BidsController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions = await this.transactionHistoryService.listByCriteria(
            [
                {
                    typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                    type: Enums.NFTTransactionTypes.NFTBid,
                },
            ],
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, BidResource, request.query.transform);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTBid,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Bid not found");
        }
        return this.respondWithResource(transaction, BidResource);
    }

    public async showAuctionWallet(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        let wallet: Contracts.State.Wallet;
        try {
            wallet = this.walletRepository.findByIndex(Indexers.NFTExchangeIndexers.BidIndexer, request.params.id);
        } catch (e) {
            return Boom.notFound("Bid Not Found");
        }

        return this.respondWithResource(wallet, WalletResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const criteria: Contracts.Search.OrCriteria<Contracts.Shared.TransactionCriteria> = [];
        if (request.payload.senderPublicKey) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTBid,
                senderPublicKey: request.payload.senderPublicKey,
            });
        }
        if (request.payload.auctionId) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTBid,
                asset: {
                    nftBid: {
                        auctionId: request.payload.auctionId,
                    },
                },
            });
        }
        if (request.payload.bidAmount) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTBid,
                asset: {
                    nftBid: {
                        bidAmount: request.payload.bidAmount,
                    },
                },
            });
        }

        const transactions = await this.transactionHistoryService.listByCriteria(
            criteria,
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, BidResource);
    }

    public async indexCanceled(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions = await this.transactionHistoryService.listByCriteria(
            [
                {
                    typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                    type: Enums.NFTTransactionTypes.NFTBidCancel,
                },
            ],
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, BidCancelResource, request.query.transform);
    }

    public async showAuctionCanceled(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTBidCancel,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Auction not found");
        }
        return this.respondWithResource(transaction, BidCancelResource);
    }
}
