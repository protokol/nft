import { ApiResponse, Resource } from "@arkecosystem/client";

import { Configurations as ConfigurationsResource } from "../../resourcesTypes/exchange";

export class Configurations extends Resource {
    public async index(): Promise<ApiResponse<ConfigurationsResource>> {
        return this.sendGet("exchange/configurations");
    }
}
