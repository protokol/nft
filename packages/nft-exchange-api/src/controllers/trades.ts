import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-exchange-crypto";

import { TradeResource } from "../resources/trades";
import { TradeDetailsResource } from "../resources/trades-show";

@Container.injectable()
export class TradesController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions = await this.transactionHistoryService.listByCriteria(
            [
                {
                    typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                    type: Enums.NFTTransactionTypes.NFTAcceptTrade,
                },
            ],
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, TradeResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            ...request.query,
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTAcceptTrade,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Trade was not found!");
        }

        const auctionTransaction = await this.transactionHistoryService.findOneByCriteria({
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTAuction,
            // @ts-ignore
            id: transaction.asset.nftAcceptTrade.auctionId,
        });

        const bidTransaction = await this.transactionHistoryService.findOneByCriteria({
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTBid,
            // @ts-ignore
            id: transaction.asset.nftAcceptTrade.bidId,
        });

        const result = {
            transaction: transaction,
            auction: auctionTransaction,
            bid: bidTransaction,
        };

        return this.respondWithResource(result, TradeDetailsResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const criteria: Contracts.Search.OrCriteria<Contracts.Shared.TransactionCriteria> = [];
        if (request.payload.senderPublicKey) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTAcceptTrade,
                senderPublicKey: request.payload.senderPublicKey,
            });
        }
        if (request.payload.auctionId) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTAcceptTrade,
                asset: {
                    nftAcceptTrade: {
                        auctionId: request.payload.auctionId,
                    },
                },
            });
        }
        if (request.payload.bidId) {
            criteria.push({
                typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
                type: Enums.NFTTransactionTypes.NFTAcceptTrade,
                asset: {
                    nftAcceptTrade: {
                        auctionId: request.payload.auctionId,
                    },
                },
            });
        }

        const transactions = await this.transactionHistoryService.listByCriteria(
            criteria,
            this.getListingOrder(request),
            this.getListingPage(request),
        );

        return this.toPagination(transactions, TradeResource);
    }
}
