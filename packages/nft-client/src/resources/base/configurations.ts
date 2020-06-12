import { ApiResponse } from "@arkecosystem/client";
import { Resource } from "@arkecosystem/client/dist/resources/resource";

import { Configurations as ConfigurationsResource } from "../../resourcesTypes/base";

export class Configurations extends Resource {
    public async index(): Promise<ApiResponse<ConfigurationsResource>> {
        return this.sendGet("configurations");
    }
}
