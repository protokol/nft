import { Application, Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { NullEventDispatcher } from "@arkecosystem/core-kernel/src/services/events/drivers/null";
import { Wallets } from "@arkecosystem/core-state";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import {
    addressesIndexer,
    ipfsIndexer,
    locksIndexer,
    publicKeysIndexer,
    usernamesIndexer,
} from "@arkecosystem/core-state/src/wallets/indexers/indexers";
import { Mocks } from "@arkecosystem/core-test-framework";
import { Collator } from "@arkecosystem/core-transaction-pool/src";
import { DynamicFeeMatcher } from "@arkecosystem/core-transaction-pool/src/dynamic-fee-matcher";
import { ExpirationService } from "@arkecosystem/core-transaction-pool/src/expiration-service";
import { Mempool } from "@arkecosystem/core-transaction-pool/src/mempool";
import { Query } from "@arkecosystem/core-transaction-pool/src/query";
import { SenderMempool } from "@arkecosystem/core-transaction-pool/src/sender-mempool";
import { SenderState } from "@arkecosystem/core-transaction-pool/src/sender-state";
import { One, Two } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerProvider } from "@arkecosystem/core-transactions/src/handlers/handler-provider";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Identities, Utils } from "@arkecosystem/crypto";

import {
    ApplyTransactionAction,
    RevertTransactionAction,
    ThrowIfCannotEnterPoolAction,
    VerifyTransactionAction,
} from "@arkecosystem/core-transaction-pool/src/actions";
import { Handlers as NFTBaseHandlers } from "@protokol/nft-base-transactions";

import { transactionRepository } from "../__mocks__/transaction-repository";

const logger = {
    notice: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
};

export const initApp = (): Application => {
    const app: Application = new Application(new Container.Container());
    app.bind(Identifiers.ApplicationNamespace).toConstantValue("testnet");

    app.bind(Identifiers.LogService).toConstantValue(logger);

    app.bind<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    app.bind<Contracts.State.WalletIndexerIndex>(Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Addresses,
        indexer: addressesIndexer,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.PublicKeys,
        indexer: publicKeysIndexer,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Usernames,
        indexer: usernamesIndexer,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Ipfs,
        indexer: ipfsIndexer,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Locks,
        indexer: locksIndexer,
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

    app.bind(Container.Identifiers.StateStore).to(StateStore).inTransientScope();

    app.bind(Identifiers.TransactionPoolMempool).to(Mempool).inSingletonScope();

    app.bind(Identifiers.TransactionPoolQuery).to(Query).inSingletonScope();

    app.bind(Container.Identifiers.TransactionPoolCollator).to(Collator);
    app.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).to(DynamicFeeMatcher);
    app.bind(Container.Identifiers.TransactionPoolExpirationService).to(ExpirationService);

    app.bind(Container.Identifiers.TransactionPoolSenderMempool).to(SenderMempool);
    app.bind(Container.Identifiers.TransactionPoolSenderMempoolFactory).toAutoFactory(
        Container.Identifiers.TransactionPoolSenderMempool,
    );
    app.bind(Container.Identifiers.TransactionPoolSenderState).to(SenderState);

    app.bind(Identifiers.WalletRepository).to(Wallets.WalletRepository).inSingletonScope();

    app.bind(Identifiers.EventDispatcherService).to(NullEventDispatcher).inSingletonScope();

    app.bind(Identifiers.DatabaseBlockRepository).toConstantValue(Mocks.BlockRepository.instance);

    app.bind(Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);

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

    app.bind(Identifiers.TransactionHandler).to(NFTBaseHandlers.NFTRegisterCollectionHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTBaseHandlers.NFTCreateHandler);
    app.bind(Identifiers.TransactionHandler).to(NFTBaseHandlers.NFTTransferHandler);

    return app;
};

export const buildWallet = (app: Application, passphrase: string): Contracts.State.Wallet => {
    const walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    const wallet: Contracts.State.Wallet = walletRepository.createWallet(Identities.Address.fromPassphrase(passphrase));
    wallet.address = Identities.Address.fromPassphrase(passphrase);
    wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
    wallet.balance = Utils.BigNumber.make(7527654310);

    return wallet;
};