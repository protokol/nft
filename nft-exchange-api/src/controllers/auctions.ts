import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Indexers } from "@protokol/nft-exchange-transactions";

import { AuctionResource } from "../resources/auctions";
import { AuctionCancelResource } from "../resources/auctions-cancel";
import { WalletResource } from "../resources/wallets";

@Container.injectable()
export class AuctionsController extends Controller {
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
                    type: Enums.NFTTransactionTypes.NFTAuction,
                },
            ],
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, AuctionResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTAuction,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Auction not found");
        }
        return this.respondWithResource(transaction, AuctionResource);
    }

    // todo revisit - check indexer not working correctly
    public async showAuctionWallet(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        let wallet: Contracts.State.Wallet;
        try {
            wallet = this.walletRepository.findByIndex(Indexers.NFTExchangeIndexers.AuctionIndexer, request.params.id);
        } catch (e) {
            return Boom.notFound("Auction Not Found");
        }

        return this.respondWithResource(wallet, WalletResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const criteria: Contracts.Search.OrCriteria<Contracts.Shared.TransactionCriteria> = [];
        if (request.payload.senderPublicKey) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTAuction,
                senderPublicKey: request.payload.senderPublicKey,
            });
        }
        if (request.payload.nftId) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTAuction,
                asset: {
                    nftAuction: {
                        nftId: request.payload.nftId,
                    },
                },
            });
        }
        if (request.payload.startAmount) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTAuction,
                asset: {
                    nftAuction: {
                        startAmount: request.payload.startAmount,
                    },
                },
            });
        }
        if (request.payload.expiration) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTAuction,
                asset: {
                    nftAuction: {
                        expiration: request.payload.expiration,
                    },
                },
            });
        }

        const transactions = await this.transactionHistoryService.listByCriteria(
            criteria,
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, AuctionResource);
    }

    public async indexCanceled(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions = await this.transactionHistoryService.listByCriteria(
            [
                {
                    typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                    type: Enums.NFTTransactionTypes.NFTAuctionCancel,
                },
            ],
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, AuctionCancelResource);
    }

    public async showAuctionCanceled(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTAuctionCancel,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Auction not found");
        }
        return this.respondWithResource(transaction, AuctionCancelResource);
    }
}
