import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { GuardianGroupPermissionsHandler, GuardianUserPermissionsHandler } from "./handlers";
import { GuardianIndexers, guardianUserPermissionIndexer } from "./wallet-indexes";

const pluginName = require("../package.json").name;

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerIndexers();

        this.app.bind(Container.Identifiers.TransactionHandler).to(GuardianUserPermissionsHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(GuardianGroupPermissionsHandler);

        const cacheFactory: any = this.app.get(Container.Identifiers.CacheFactory);
        this.app
            .bind(Container.Identifiers.CacheService)
            .toConstantValue(await cacheFactory())
            .whenTargetTagged("cache", pluginName);
    }

    private registerIndexers() {
        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: GuardianIndexers.UserPermissionsIndexer, indexer: guardianUserPermissionIndexer });
    }
}
