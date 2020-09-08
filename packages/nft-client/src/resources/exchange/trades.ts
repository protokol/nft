import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import {
    AllTradesQuery,
    SearchTradesApiBody,
    SearchTradesApiQuery,
    TradeById,
    Trades as TradesResource,
} from "../../resourcesTypes/exchange";

export class Trades extends Resource {
    public async all(query?: AllTradesQuery): Promise<ApiResponseWithPagination<TradesResource[]>> {
        return this.sendGet("nft/exchange/trades");
    }

    public async get(id: string): Promise<ApiResponse<TradeById>> {
        return this.sendGet(`nft/exchange/trades/${id}`);
    }

    public async search(
        payload: SearchTradesApiBody,
        query?: SearchTradesApiQuery,
    ): Promise<ApiResponseWithPagination<TradesResource[]>> {
        return this.sendPost("nft/exchange/trades/search", payload, query);
    }
}
