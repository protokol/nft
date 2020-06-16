import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import { Auctions as AuctionsResource, AuctionsWallet } from "../../resourcesTypes/exchange";

export class Auctions extends Resource {
    public async getAllAuctions(): Promise<ApiResponseWithPagination<AuctionsResource[]>> {
        return this.sendGet("exchange/auctions");
    }

    public async getAuctionById(id: string): Promise<ApiResponse<AuctionsResource>> {
        return this.sendGet(`exchange/auctions/${id}`);
    }

    public async getAuctionsWallets(id: string): Promise<ApiResponse<AuctionsWallet>> {
        return this.sendGet(`exchange/auctions/${id}/wallets`);
    }
}
