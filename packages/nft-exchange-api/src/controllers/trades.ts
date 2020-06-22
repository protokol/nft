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
            this.buildTradeCriteria(),
            this.getListingOrder(request),
            this.getListingPage(request),
        );
        return this.toPagination(transactions, TradeResource, request.query.transform);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria(
            this.buildTradeCriteria({
                ...request.query,
                id: request.params.id,
            }),
        );
        if (!transaction) {
            return Boom.notFound("Trade was not found!");
        }

        const { nftAcceptTrade } = transaction.asset!;
        const criteria: Contracts.Search.OrCriteria<Contracts.Shared.TransactionCriteria> = [];
        criteria.push({
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTAuction,
            id: nftAcceptTrade.auctionId,
        });
        criteria.push({
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTBid,
            id: nftAcceptTrade.bidId,
        });
        const transactions = await this.transactionHistoryService.findManyByCriteria(criteria);

        const result = {
            transaction: transaction,
            auction: transactions.find((tx) => tx.id === nftAcceptTrade.auctionId),
            bid: transactions.find((tx) => tx.id === nftAcceptTrade.bidId),
        };

        return this.respondWithResource(result, TradeDetailsResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const { senderPublicKey, auctionId, bidId } = request.payload;
        const criteria: Contracts.Search.OrCriteria<Contracts.Shared.TransactionCriteria> = [];
        if (senderPublicKey) {
            criteria.push(
                this.buildTradeCriteria({
                    senderPublicKey,
                }),
            );
        }
        if (auctionId) {
            criteria.push(
                this.buildTradeCriteria({
                    asset: {
                        nftAcceptTrade: {
                            auctionId,
                        },
                    },
                }),
            );
        }
        if (bidId) {
            criteria.push(
                this.buildTradeCriteria({
                    asset: {
                        nftAcceptTrade: {
                            bidId,
                        },
                    },
                }),
            );
        }

        const transactions = await this.transactionHistoryService.listByCriteria(
            criteria,
            this.getListingOrder(request),
            this.getListingPage(request),
        );

        return this.toPagination(transactions, TradeResource);
    }

    private buildTradeCriteria(otherCriteria?: object) {
        return {
            typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
            type: Enums.NFTTransactionTypes.NFTAcceptTrade,
            ...otherCriteria,
        };
    }
}
