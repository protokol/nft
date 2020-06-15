import { ApiResponse, Resource } from "@arkecosystem/client";

import { Configurations as ConfigurationsResource } from "../../resourcesTypes/base";

export class Configurations extends Resource {
    public async index(): Promise<ApiResponse<ConfigurationsResource>> {
        return this.sendGet("configurations");
    }
}
