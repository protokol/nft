import { Generators } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";
import { Transactions as NFTTransactions } from "@protokol/nft-base-crypto";
import { unlinkSync } from "fs";
import { Connection, createConnection } from "typeorm";

const dbName = "dbFilename";

export const setupAppAndGetConnection = async (): Promise<Connection> => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);
	Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTCreateTransaction);
	Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTBurnTransaction);
	Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NFTTransferTransaction);

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
};
