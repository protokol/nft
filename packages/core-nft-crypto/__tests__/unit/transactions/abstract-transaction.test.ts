import { Errors, Managers, Transactions } from "@arkecosystem/crypto";
import Buffer from "buffer";

// eslint-disable-next-line jest/no-mocks-import
import { DummyNFTBuilder, DummyNFTBuilder2, DummyNFTTrx, DummyNFTTrx2 } from "../../__mocks__/dummy";

beforeAll(() => {
	Managers.configManager.setFromPreset("testnet" as any);
	Managers.configManager.setHeight(2);
	Transactions.TransactionRegistry.registerTransactionType(DummyNFTTrx);
});

describe("Dummy Transaction Tests", () => {
	describe("Serialisation and De-Serialisation", () => {
		it("Should Serialise and De-Serialise Built Transaction", () => {
			const actual = new DummyNFTBuilder()
				.vendorField("Registration Transaction")
				.nonce("4")
				.sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
				.getStruct();

			const serialized: Buffer = Transactions.TransactionFactory.fromData(actual as any).serialized;
			const deserialized = Transactions.Deserializer.deserialize(serialized.toString("hex"));

			expect(deserialized.data.asset).toStrictEqual({});
		});

		it("Should Throw NotImplemented Error", () => {
			expect(() => Transactions.TransactionRegistry.registerTransactionType(DummyNFTTrx2)).toThrow(
				Errors.NotImplemented,
			);
		});
	});
});
