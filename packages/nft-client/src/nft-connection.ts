import { Connection } from "@arkecosystem/client";

import { NFTBaseAvailableResource, NFTBaseAvailableResourcesName, NFTBaseResources } from "./resources/base";

export class NFTConnection extends Connection {
    public NFTBaseApi<T extends NFTBaseAvailableResourcesName>(name: T) {
        // Convert to lower case to be backward-compatible
        const selectedResourceClass = NFTBaseResources[name.toLowerCase() as NFTBaseAvailableResourcesName];
        return new selectedResourceClass(this) as NFTBaseAvailableResource<T>;
    }
}
