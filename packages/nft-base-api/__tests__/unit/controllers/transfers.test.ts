import "jest-extended";

import { Application, Utils } from "@arkecosystem/core-kernel";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Identities, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import { TransfersController } from "../../../src/controllers/transfers";
import {
	blockHistoryService,
	initApp,
	ItemResponse,
	PaginatedResponse,
	transactionHistoryService,
} from "../__support__";
let app: Application;

let transfersController: TransfersController;

let actual: Interfaces.ITransaction;

const timestamp = Utils.formatTimestamp(104930456);

beforeEach(() => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);

	app = initApp();

	transactionHistoryService.findManyByCriteria.mockReset();
	transactionHistoryService.findOneByCriteria.mockReset();
	transactionHistoryService.listByCriteria.mockReset();

	blockHistoryService.findOneByCriteria.mockReset();

	transfersController = app.resolve<TransfersController>(TransfersController);

	actual = new Builders.NFTTransferBuilder()
		.NFTTransferAsset({
			nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
			recipientId: Identities.Address.fromPassphrase(passphrases[1]!),
		})
		.sign(passphrases[0]!)
		.build();
});

afterEach(() => {
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTRegisterCollectionTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTCreateTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTTransferTransaction);
	Transactions.TransactionRegistry.deregisterTransactionType(NFTTransactions.NFTBurnTransaction);
});

describe("Test transfer controller", () => {
	it("index - return all transfer transactions", async () => {
		transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
			results: [{ data: actual.data, block: { timestamp: timestamp.epoch } }],
		});

		const request: Hapi.Request = {
			query: {
				page: 1,
				limit: 100,
				transform: true,
			},
		};
		const response = (await transfersController.index(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftTransfer: {
				nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
				recipientId: Identities.Address.fromPassphrase(passphrases[1]!),
			},
			timestamp,
		});
	});

	it("show - return specific transfer transaction by its id", async () => {
		transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);
		blockHistoryService.findOneByCriteria.mockResolvedValueOnce({ timestamp: timestamp.epoch });

		const request: Hapi.Request = {
			query: {
				transform: true,
			},
			params: {
				id: actual.id,
			},
		};

		const response = (await transfersController.show(request, undefined)) as ItemResponse;
		expect(response.data).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftTransfer: {
				nftIds: ["dfa8cbc8bba806348ebf112a4a01583ab869cccf72b72f7f3d28af9ff902d06d"],
				recipientId: Identities.Address.fromPassphrase(passphrases[1]!),
			},
			timestamp,
		});
	});
});
