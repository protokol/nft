import { Generators } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { Transactions as NFTExchangeTransactions } from "@protokol/nft-exchange-crypto";
import { unlinkSync } from "fs";
import { Connection, createConnection } from "typeorm";

const dbName = `${process.env.CORE_PATH_DATA}/dbFilename.sqlite`;

export const setupAppAndGetConnection = async (): Promise<Connection> => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);
	Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTCreateTransaction);
	Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTBurnTransaction);
	Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTTransferTransaction);
	Transactions.TransactionRegistry.registerTransactionType(NFTExchangeTransactions.NFTAuctionTransaction);
	Transactions.TransactionRegistry.registerTransactionType(NFTExchangeTransactions.NFTAuctionCancelTransaction);
	Transactions.TransactionRegistry.registerTransactionType(NFTExchangeTransactions.NFTAcceptTradeTransaction);
	Transactions.TransactionRegistry.registerTransactionType(NFTExchangeTransactions.NFTBidTransaction);
	Transactions.TransactionRegistry.registerTransactionType(NFTExchangeTransactions.NFTBidCancelTransaction);

	return await createConnection({
		type: "better-sqlite3",
		database: dbName,
		entities: [__dirname + "/../../../src/entities/*.ts"],
	});
};

export const resetDb = async (connection: Connection) => {
	await connection.synchronize(true);
};

export const tearDownAppAndcloseConnection = async (connection: Connection) => {
	await connection.close();
	unlinkSync(dbName);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTCreateTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBurnTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTTransferTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTExchangeTransactions.NFTAuctionTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTExchangeTransactions.NFTAuctionCancelTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTExchangeTransactions.NFTAcceptTradeTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTExchangeTransactions.NFTBidTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTExchangeTransactions.NFTBidCancelTransaction);
};
