import { Application, Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { MemoryCacheStore } from "@arkecosystem/core-kernel/src/services/cache/drivers/memory";
import { NullEventDispatcher } from "@arkecosystem/core-kernel/src/services/events/drivers/null";
import { Wallets } from "@arkecosystem/core-state";
import { publicKeysIndexer } from "@arkecosystem/core-state/src/wallets/indexers/indexers";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { One, Two } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerProvider } from "@arkecosystem/core-transactions/src/handlers/handler-provider";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Identities, Utils } from "@arkecosystem/crypto";
import { Handlers, Indexers } from "@protokol/nft-base-transactions";

export type PaginatedResponse = {
    totalCount: number;
    results: [object];
    meta: object;
};

export type ItemResponse = {
    data: object;
};

export type ErrorResponse = {
    output: {
        statusCode: number;
    };
};

const logger = {
    notice: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
};

export const transactionHistoryService = {
    findManyByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
    listByCriteria: jest.fn(),
};

export const buildSenderWallet = (app: Application): Contracts.State.Wallet => {
    const walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    const wallet: Contracts.State.Wallet = walletRepository.createWallet(
        Identities.Address.fromPassphrase(passphrases[0]),
    );

    wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrases[0]);
    wallet.balance = Utils.BigNumber.make(7527654310);

    return wallet;
};

export const initApp = (): Application => {
    const app = new Application(new Container.Container());

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
    app.bind(Container.Identifiers.StateStore).toConstantValue({});
    app.bind(Container.Identifiers.BlockchainService).toConstantValue({});
    app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue({});
    app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});
    app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue({});
    app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue({});
    app.bind(Container.Identifiers.PeerStorage).toConstantValue({});
    app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue({});
    app.bind(Container.Identifiers.TransactionPoolProcessorFactory).toConstantValue({});
    app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    app.bind(Identifiers.TransactionHandler).to(One.TransferTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.TransferTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.SecondSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.SecondSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.DelegateRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.DelegateRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.VoteTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.VoteTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.MultiSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.MultiSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.IpfsTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.MultiPaymentTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.DelegateResignationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcLockTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcClaimTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcRefundTransactionHandler);

    app.bind(Identifiers.TransactionHandlerProvider).to(TransactionHandlerProvider).inSingletonScope();
    app.bind(Identifiers.TransactionHandlerRegistry).to(TransactionHandlerRegistry).inSingletonScope();

    app.bind(Identifiers.EventDispatcherService).to(NullEventDispatcher).inSingletonScope();

    app.bind(Container.Identifiers.CacheService).to(MemoryCacheStore).inSingletonScope();

    app.bind(Identifiers.TransactionHandler).to(Handlers.NFTRegisterCollectionHandler);
    app.bind(Identifiers.TransactionHandler).to(Handlers.NFTCreateHandler);
    app.bind(Identifiers.TransactionHandler).to(Handlers.NFTTransferHandler);
    app.bind(Identifiers.TransactionHandler).to(Handlers.NFTBurnHandler);

    app.bind<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    app.bind<Contracts.State.WalletIndexerIndex>(Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Indexers.NFTIndexers.CollectionIndexer,
        indexer: Indexers.nftCollectionIndexer,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Indexers.NFTIndexers.NFTTokenIndexer,
        indexer: Indexers.nftIndexer,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.PublicKeys,
        indexer: publicKeysIndexer,
    });

    app.bind(Identifiers.WalletFactory).toFactory<Contracts.State.Wallet>(
        (context: Container.interfaces.Context) => (address: string) =>
            new Wallets.Wallet(
                address,
                new Services.Attributes.AttributeMap(
                    context.container.get<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes),
                ),
            ),
    );

    app.bind(Identifiers.WalletRepository).to(Wallets.WalletRepository).inSingletonScope();

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    return app;
};
