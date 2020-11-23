import "jest-extended";

import { Application, Utils } from "@arkecosystem/core-kernel";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Builders, Transactions as NFTTransactions } from "@protokol/nft-base-crypto";

import { BurnsController } from "../../../src/controllers/burns";
import {
	blockHistoryService,
	initApp,
	ItemResponse,
	PaginatedResponse,
	transactionHistoryService,
} from "../__support__";
let app: Application;

let burnsController: BurnsController;

let actual: Interfaces.ITransaction;

const timestamp = Utils.formatTimestamp(104930456);

beforeEach(() => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);

	app = initApp();

	transactionHistoryService.findManyByCriteria.mockReset();
	transactionHistoryService.findOneByCriteria.mockReset();
	transactionHistoryService.listByCriteria.mockReset();
	transactionHistoryService.listByCriteriaJoinBlock.mockReset();

	blockHistoryService.findOneByCriteria.mockReset();

	burnsController = app.resolve<BurnsController>(BurnsController);

	actual = new Builders.NFTBurnBuilder()
		.NFTBurnAsset({
			nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
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

describe("Test burns controller", () => {
	it("index - return all burn transactions", async () => {
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

		const response = (await burnsController.index(request, undefined)) as PaginatedResponse;
		expect(response.results[0]!).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftBurn: {
				nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			},
			timestamp,
		});
	});

	it("show - return specific burn by its id", async () => {
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

		const response = (await burnsController.show(request, undefined)) as ItemResponse;
		expect(response.data).toStrictEqual({
			id: actual.id,
			senderPublicKey: actual.data.senderPublicKey,
			nftBurn: {
				nftId: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
			},
			timestamp,
		});
	});
});
