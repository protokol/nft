import { Connection } from "@arkecosystem/client";

import { GuardianAvailableResource, GuardianAvailableResourcesName, GuardianResources } from "./resources/guardian";

export class GuardianConnection extends Connection {
    public guardianApi<T extends GuardianAvailableResourcesName>(name: T) {
        const selectedResourceClass = GuardianResources[name.toLowerCase() as GuardianAvailableResourcesName];
        return new selectedResourceClass(this) as GuardianAvailableResource<T>;
    }
}
