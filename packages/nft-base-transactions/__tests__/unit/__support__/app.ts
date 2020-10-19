// TODO addrest DIST imports - sync with CORE v3
import { Application, Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { Generators, Mocks } from "@arkecosystem/core-test-framework";
import {
    ApplyTransactionAction,
    Collator,
    DynamicFeeMatcher,
    ExpirationService,
    Mempool,
    Query,
    RevertTransactionAction,
    SenderMempool,
    SenderState,
    ThrowIfCannotEnterPoolAction,
    VerifyTransactionAction,
} from "@arkecosystem/core-transaction-pool";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";

import { transactionRepository } from "../__mocks__/transaction-repository";
import {
    NFTBurnHandler,
    NFTCreateHandler,
    NFTRegisterCollectionHandler,
    NFTTransferHandler,
} from "../../../src/handlers";
import { nftCollectionIndexer, nftIndexer, NFTIndexers } from "../../../src/wallet-indexes";

const logger = {
    notice: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
};

export const transactionHistoryService = {
    findManyByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
    streamByCriteria: jest.fn(),
};

export const initApp = (): Application => {
    const config = Generators.generateCryptoConfigRaw();
    Managers.configManager.setConfig(config);

    const app: Application = new Application(new Container.Container());
    app.bind(Container.Identifiers.ApplicationNamespace).toConstantValue("testnet");

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    app.bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Addresses,
        indexer: Wallets.addressesIndexer,
        autoIndex: true,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.PublicKeys,
        indexer: Wallets.publicKeysIndexer,
        autoIndex: true,
    });

    app.bind(Container.Identifiers.WalletFactory).toFactory<Contracts.State.Wallet>(
        (context: Container.interfaces.Context) => (address: string) =>
            new Wallets.Wallet(
                address,
                new Services.Attributes.AttributeMap(
                    context.container.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes),
                ),
            ),
    );

    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

    app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set("maxTransactionAge", 500);
    app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
        "maxTransactionBytes",
        2000000,
    );
    app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
        "maxTransactionsPerSender",
        300,
    );

    app.bind(Container.Identifiers.StateStore).to(Stores.StateStore).inTransientScope();

    app.bind(Container.Identifiers.TransactionPoolMempool).to(Mempool).inSingletonScope();

    app.bind(Container.Identifiers.TransactionPoolQuery).to(Query).inSingletonScope();

    app.bind(Container.Identifiers.TransactionPoolCollator).to(Collator);
    app.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).to(DynamicFeeMatcher);
    app.bind(Container.Identifiers.TransactionPoolExpirationService).to(ExpirationService);

    app.bind(Container.Identifiers.TransactionPoolSenderMempool).to(SenderMempool);
    app.bind(Container.Identifiers.TransactionPoolSenderMempoolFactory).toAutoFactory(
        Container.Identifiers.TransactionPoolSenderMempool,
    );
    app.bind(Container.Identifiers.TransactionPoolSenderState).to(SenderState);

    app.bind(Container.Identifiers.WalletRepository).to(Wallets.WalletRepository).inSingletonScope();

    app.bind(Container.Identifiers.EventDispatcherService).to(Services.Events.NullEventDispatcher).inSingletonScope();

    app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(Mocks.BlockRepository.instance);

    app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);

    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.One.TransferTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.TransferTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.One.SecondSignatureRegistrationTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.SecondSignatureRegistrationTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.One.DelegateRegistrationTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.DelegateRegistrationTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.One.VoteTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.VoteTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.One.MultiSignatureRegistrationTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.MultiSignatureRegistrationTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.IpfsTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.MultiPaymentTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.DelegateResignationTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.HtlcLockTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.HtlcClaimTransactionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(Handlers.Two.HtlcRefundTransactionHandler);

    app.bind(Container.Identifiers.TransactionHandlerProvider)
        .to(Handlers.TransactionHandlerProvider)
        .inSingletonScope();
    app.bind(Container.Identifiers.TransactionHandlerRegistry).to(Handlers.Registry).inSingletonScope();

    app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();

    app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService).bind(
        "verifyTransaction",
        new VerifyTransactionAction(),
    );

    app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService).bind(
        "throwIfCannotEnterPool",
        new ThrowIfCannotEnterPoolAction(),
    );

    app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService).bind(
        "applyTransaction",
        new ApplyTransactionAction(),
    );

    app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService).bind(
        "revertTransaction",
        new RevertTransactionAction(),
    );

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: NFTIndexers.NFTTokenIndexer,
        indexer: nftIndexer,
        autoIndex: false,
    });
    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: NFTIndexers.CollectionIndexer,
        indexer: nftCollectionIndexer,
        autoIndex: false,
    });

    transactionHistoryService.findManyByCriteria.mockReset();
    transactionHistoryService.findOneByCriteria.mockReset();
    transactionHistoryService.streamByCriteria.mockReset();
    app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    app.bind(Container.Identifiers.TransactionHandler).to(NFTRegisterCollectionHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(NFTCreateHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(NFTBurnHandler);
    app.bind(Container.Identifiers.TransactionHandler).to(NFTTransferHandler);

    app.bind(Container.Identifiers.CacheService).to(Services.Cache.MemoryCacheStore).inSingletonScope();

    return app;
};

export const buildWallet = (app: Application, passphrase: string): Contracts.State.Wallet => {
    const walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    const wallet: Contracts.State.Wallet = walletRepository.createWallet(Identities.Address.fromPassphrase(passphrase));
    wallet.address = Identities.Address.fromPassphrase(passphrase);
    wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
    wallet.balance = Utils.BigNumber.make(7527654310);

    return wallet;
};
