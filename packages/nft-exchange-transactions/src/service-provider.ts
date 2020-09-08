import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import {
    NFTAcceptTradeHandler,
    NFTAuctionCancelHandler,
    NFTAuctionHandler,
    NFTBidCancelHandler,
    NFTBidHandler,
} from "./handlers";
import { auctionIndexer, bidIndexer, NFTExchangeIndexers } from "./wallet-indexes";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerIndexers();

        this.app.bind(Container.Identifiers.TransactionHandler).to(NFTAuctionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(NFTBidHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(NFTAuctionCancelHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(NFTBidCancelHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(NFTAcceptTradeHandler);
    }

    private registerIndexers() {
        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: NFTExchangeIndexers.AuctionIndexer, indexer: auctionIndexer, autoIndex: false });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: NFTExchangeIndexers.BidIndexer, indexer: bidIndexer, autoIndex: false });
    }
}
