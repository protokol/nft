import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { NFTBurnHandler, NFTCreateHandler, NFTRegisterCollectionHandler, NFTTransferHandler } from "./handlers";
import { nftCollectionIndexer, nftIndexer, NFTIndexers } from "./wallet-indexes";

const pluginName = require("../package.json").name;

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerIndexers();

        this.app.bind(Container.Identifiers.TransactionHandler).to(NFTRegisterCollectionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(NFTCreateHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(NFTTransferHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(NFTBurnHandler);

        const cacheFactory: any = this.app.get(Container.Identifiers.CacheFactory);
        this.app
            .bind(Container.Identifiers.CacheService)
            .toConstantValue(await cacheFactory())
            .whenTargetTagged("cache", pluginName);
    }

    private registerIndexers() {
        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: NFTIndexers.NFTTokenIndexer, indexer: nftIndexer, autoIndex: false });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: NFTIndexers.CollectionIndexer, indexer: nftCollectionIndexer, autoIndex: false });
    }
}
