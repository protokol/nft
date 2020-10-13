import { Application, Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Utils } from "@arkecosystem/crypto";
import { Handlers as GuardianHandlers, Indexers } from "@protokol/guardian-transactions";

import { Identifiers } from "../../../src/identifiers";
import { GroupSearchService, UserSearchService } from "../../../src/services";

export type PaginatedResponse = {
	totalCount: number;
	results: [object];
	meta: object;
};

export type ItemResponse = {
	data: object;
};

export type CollectionResponse = {
	data: object[];
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
	listByCriteriaJoinBlock: jest.fn(),
};

export const blockHistoryService = {
	findOneByCriteria: jest.fn(),
};

export const buildWallet = (app: Application, passphrase: string): Contracts.State.Wallet => {
	const walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

	const wallet: Contracts.State.Wallet = walletRepository.createWallet(Identities.Address.fromPassphrase(passphrase));
	wallet.address = Identities.Address.fromPassphrase(passphrase);
	wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
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
	app.bind(Container.Identifiers.BlockHistoryService).toConstantValue(blockHistoryService);
	app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

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

	app.bind(Container.Identifiers.EventDispatcherService).to(Services.Events.NullEventDispatcher).inSingletonScope();

	app.bind(Container.Identifiers.CacheService).to(Services.Cache.MemoryCacheStore).inSingletonScope();

	app.bind(Container.Identifiers.TransactionHandler).to(GuardianHandlers.GuardianGroupPermissionsHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(GuardianHandlers.GuardianUserPermissionsHandler);

	app.bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
		.to(Services.Attributes.AttributeSet)
		.inSingletonScope();

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Indexers.GuardianIndexers.UserPermissionsIndexer,
		indexer: Indexers.guardianUserPermissionIndexer,
		autoIndex: false,
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

	app.bind(Container.Identifiers.WalletRepository).to(Wallets.WalletRepository).inSingletonScope();

	// Triggers registration of indexes
	app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

	app.bind(Container.Identifiers.PaginationService).to(Services.Search.PaginationService);
	app.bind(Identifiers.GroupSearchService).to(GroupSearchService);
	app.bind(Identifiers.UserSearchService).to(UserSearchService);
	app.bind(Container.Identifiers.StandardCriteriaService).to(Services.Search.StandardCriteriaService);

	return app;
};
