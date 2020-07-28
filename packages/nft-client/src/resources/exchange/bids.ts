import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import {
    AllBidsCanceledQuery,
    AllBidsQuery,
    BidCanceled,
    BidCanceledTimestamp,
    Bids as BidsResource,
    BidsTimestamp,
    BidsWallet,
    SearchBidsApiBody,
    SearchBidsApiQuery,
} from "../../resourcesTypes/exchange";

export class Bids extends Resource {
    public async getAllBids(query?: AllBidsQuery): Promise<ApiResponse<BidsTimestamp>> {
        return this.sendGet("nft/exchange/bids");
    }

    public async getBidById(id: string): Promise<ApiResponse<BidsResource>> {
        return this.sendGet(`nft/exchange/bids/${id}`);
    }

    public async getBidsWallets(id: string): Promise<ApiResponse<BidsWallet>> {
        return this.sendGet(`nft/exchange/bids/${id}/wallets`);
    }

    public async searchByBid(
        payload: SearchBidsApiBody,
        query?: SearchBidsApiQuery,
    ): Promise<ApiResponseWithPagination<BidsTimestamp[]>> {
        return this.sendPost("nft/exchange/bids/search", payload, query);
    }

    public async getAllCanceledBids(query?: AllBidsCanceledQuery): Promise<ApiResponse<BidCanceledTimestamp>> {
        return this.sendGet("nft/exchange/bids/canceled");
    }
    public async getCanceledBidById(id: string): Promise<ApiResponse<BidCanceled>> {
        return this.sendGet(`nft/exchange/bids/canceled/${id}`);
    }
}
