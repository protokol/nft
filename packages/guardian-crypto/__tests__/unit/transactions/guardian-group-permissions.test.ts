import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { GuardianGroupPermissionsBuilder } from "../../../src/builders";
import { PermissionKind } from "../../../src/enums";
import { GuardianGroupPermissionsTransaction } from "../../../src/transactions";

const groupPermission = {
    name: "group name",
    priority: 1,
    default: false,
    active: true,
    permissions: [{ types: [{ transactionType: 9000, transactionTypeGroup: 0 }], kind: PermissionKind.Allow }],
};

describe("Guardian set group permissions tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(GuardianGroupPermissionsTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly", () => {
            const actual = new GuardianGroupPermissionsBuilder()
                .GuardianGroupPermissions(groupPermission)
                .nonce("4")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.setGroupPermissions).toStrictEqual(groupPermission);
        });

        it("should throw if asset is undefined", () => {
            const actual = new GuardianGroupPermissionsBuilder().GuardianGroupPermissions(groupPermission).nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign(passphrases[0])).toThrow();
        });
    });
});
