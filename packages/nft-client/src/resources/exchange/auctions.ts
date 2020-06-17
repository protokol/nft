import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import {
    AllAuctionCanceledQuery,
    AllAuctionsQuery,
    AuctionCanceled,
    Auctions as AuctionsResource,
    AuctionsWallet,
    SearchAuctionsApiBody,
    SearchAuctionsApiQuery,
} from "../../resourcesTypes/exchange";

export class Auctions extends Resource {
    public async getAllAuctions(query?: AllAuctionsQuery): Promise<ApiResponseWithPagination<AuctionsResource[]>> {
        return this.sendGet("exchange/auctions");
    }

    public async getAuctionById(id: string): Promise<ApiResponse<AuctionsResource>> {
        return this.sendGet(`exchange/auctions/${id}`);
    }

    public async getAuctionsWallets(id: string): Promise<ApiResponse<AuctionsWallet>> {
        return this.sendGet(`exchange/auctions/${id}/wallets`);
    }

    public async searchByAsset(
        payload: SearchAuctionsApiBody,
        query?: SearchAuctionsApiQuery,
    ): Promise<ApiResponseWithPagination<AuctionsResource[]>> {
        return this.sendPost("exchange/auctions/search", payload, query);
    }

    public async getAllCanceledAuctions(
        query?: AllAuctionCanceledQuery,
    ): Promise<ApiResponseWithPagination<AuctionCanceled[]>> {
        return this.sendGet("exchange/auctions/canceled");
    }

    public async getCanceledAuctionById(id: string): Promise<ApiResponse<AuctionCanceled>> {
        return this.sendGet(`exchange/auctions/canceled/${id}`);
    }
}
