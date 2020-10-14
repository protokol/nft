import { Connection } from "@arkecosystem/client";

import { GuardianAvailableResource, GuardianAvailableResourcesName, GuardianResources } from "./resources/guardian";
import { NFTBaseAvailableResource, NFTBaseAvailableResourcesName, NFTBaseResources } from "./resources/nft/base";
import {
    NFTExchangeAvailableResource,
    NFTExchangeAvailableResourcesName,
    NFTExchangeResources,
} from "./resources/nft/exchange";

export class ProtokolConnection extends Connection {
    public NFTBaseApi<T extends NFTBaseAvailableResourcesName>(name: T) {
        const selectedResourceClass = NFTBaseResources[name.toLowerCase() as NFTBaseAvailableResourcesName];
        return new selectedResourceClass(this) as NFTBaseAvailableResource<T>;
    }

    public NFTExchangeApi<T extends NFTExchangeAvailableResourcesName>(name: T) {
        const selectedResourceClass = NFTExchangeResources[name.toLowerCase() as NFTExchangeAvailableResourcesName];
        return new selectedResourceClass(this) as NFTExchangeAvailableResource<T>;
    }

    public guardianApi<T extends GuardianAvailableResourcesName>(name: T) {
        const selectedResourceClass = GuardianResources[name.toLowerCase() as GuardianAvailableResourcesName];
        return new selectedResourceClass(this) as GuardianAvailableResource<T>;
    }
}
