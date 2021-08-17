import { Managers, Transactions } from "@arkecosystem/crypto";

// eslint-disable-next-line jest/no-mocks-import
import { DummyNFTBuilder, DummyNFTTrx } from "../../__mocks__/dummy";

beforeAll(() => {
	Managers.configManager.setFromPreset("testnet" as any);
	Managers.configManager.setHeight(2);
	Transactions.TransactionRegistry.registerTransactionType(DummyNFTTrx);
});

describe("Abstract NFT Transaction", () => {
	it("Should Test Builder", () => {
		const actual = new DummyNFTBuilder()
			.nonce("4")
			.sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

		expect(actual.build().verified).toBeTruthy();
		expect(actual.verify()).toBeTruthy();
	});
});
