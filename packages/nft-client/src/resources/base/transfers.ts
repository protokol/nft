import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import { Transfers as TransfersResource } from "../../resourcesTypes/base";
import { AllTransfersQuery } from "../../resourcesTypes/base";

export class Transfers extends Resource {
	public async all(query?: AllTransfersQuery): Promise<ApiResponseWithPagination<TransfersResource[]>> {
		return this.sendGet("nft/transfers");
	}

	public async get(id: string): Promise<ApiResponse<TransfersResource>> {
		return this.sendGet(`nft/transfers/${id}`);
	}
}
