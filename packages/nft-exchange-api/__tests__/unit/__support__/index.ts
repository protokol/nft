import { Application, Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Utils } from "@arkecosystem/crypto";
import { Handlers as BaseHandlers, Indexers } from "@protokol/nft-base-transactions";
import { Handlers as ExchangeHandlers, Indexers as ExchangeIndexers } from "@protokol/nft-exchange-transactions";

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
	listByCriteriaJoinBlock: jest.fn(),
};

export const blockHistoryService = {
	findOneByCriteria: jest.fn(),
};

export const buildSenderWallet = (app: Application): Contracts.State.Wallet => {
	const walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

	const wallet: Contracts.State.Wallet = walletRepository.createWallet(
		Identities.Address.fromPassphrase(passphrases[0]!),
	);

	wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrases[0]!);
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

	transactionHistoryService.findManyByCriteria.mockReset();
	transactionHistoryService.findOneByCriteria.mockReset();
	transactionHistoryService.listByCriteria.mockReset();

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

	app.bind(Container.Identifiers.TransactionHandler).to(BaseHandlers.NFTRegisterCollectionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(BaseHandlers.NFTCreateHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(BaseHandlers.NFTTransferHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(BaseHandlers.NFTBurnHandler);

	app.bind(Container.Identifiers.TransactionHandler).to(ExchangeHandlers.NFTAuctionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(ExchangeHandlers.NFTAuctionCancelHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(ExchangeHandlers.NFTBidHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(ExchangeHandlers.NFTBidCancelHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(ExchangeHandlers.NFTAcceptTradeHandler);

	app.bind(Container.Identifiers.EventDispatcherService).to(Services.Events.NullEventDispatcher).inSingletonScope();

	app.bind(Container.Identifiers.CacheService).to(Services.Cache.MemoryCacheStore).inSingletonScope();

	app.bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
		.to(Services.Attributes.AttributeSet)
		.inSingletonScope();

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Indexers.NFTIndexers.CollectionIndexer,
		indexer: Indexers.nftCollectionIndexer,
		autoIndex: true,
	});

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Indexers.NFTIndexers.NFTTokenIndexer,
		indexer: Indexers.nftIndexer,
		autoIndex: false,
	});

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: ExchangeIndexers.NFTExchangeIndexers.AuctionIndexer,
		indexer: ExchangeIndexers.auctionIndexer,
		autoIndex: false,
	});

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: ExchangeIndexers.NFTExchangeIndexers.BidIndexer,
		indexer: ExchangeIndexers.bidIndexer,
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

	return app;
};
