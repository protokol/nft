import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import {
    AllAuctionCanceledQuery,
    AllAuctionsQuery,
    AuctionCanceled,
    AuctionCanceledTimestamp,
    Auctions as AuctionsResource,
    AuctionsTimestamp,
    AuctionsWallet,
    SearchAuctionsApiBody,
    SearchAuctionsApiQuery,
} from "../../resourcesTypes/exchange";

export class Auctions extends Resource {
    public async getAllAuctions(query?: AllAuctionsQuery): Promise<ApiResponseWithPagination<AuctionsTimestamp[]>> {
        return this.sendGet("nft/exchange/auctions");
    }

    public async getAuctionById(id: string): Promise<ApiResponse<AuctionsResource>> {
        return this.sendGet(`nft/exchange/auctions/${id}`);
    }

    public async getAuctionsWallets(id: string): Promise<ApiResponse<AuctionsWallet>> {
        return this.sendGet(`nft/exchange/auctions/${id}/wallets`);
    }

    public async searchByAsset(
        payload: SearchAuctionsApiBody,
        query?: SearchAuctionsApiQuery,
    ): Promise<ApiResponseWithPagination<AuctionsTimestamp[]>> {
        return this.sendPost("nft/exchange/auctions/search", payload, query);
    }

    public async getAllCanceledAuctions(
        query?: AllAuctionCanceledQuery,
    ): Promise<ApiResponseWithPagination<AuctionCanceledTimestamp[]>> {
        return this.sendGet("nft/exchange/auctions/canceled");
    }

    public async getCanceledAuctionById(id: string): Promise<ApiResponse<AuctionCanceled>> {
        return this.sendGet(`nft/exchange/auctions/canceled/${id}`);
    }
}
