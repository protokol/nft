import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { GuardianGroupPermissionsBuilder } from "../../../src/builders";
import { IGuardianGroupPermissionsAsset } from "../../../src/interfaces";
import { GuardianGroupPermissionsTransaction } from "../../../src/transactions";

const groupPermission = {
    name: "group name",
    priority: 1,
    default: false,
    active: true,
    allow: [{ transactionType: 9000, transactionTypeGroup: 0 }],
    deny: [{ transactionType: 9000, transactionTypeGroup: 0 }],
};

describe("Guardian set group permissions tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(GuardianGroupPermissionsTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly with allow/deny permissions", () => {
            const actual = new GuardianGroupPermissionsBuilder()
                .GuardianGroupPermissions(groupPermission)
                .nonce("4")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.setGroupPermissions).toStrictEqual(groupPermission);
        });

        it("should ser/deser correctly without allow/deny permissions", () => {
            const groupPermissions: IGuardianGroupPermissionsAsset = { ...groupPermission };
            delete groupPermissions.allow;
            delete groupPermissions.deny;

            const actual = new GuardianGroupPermissionsBuilder()
                .GuardianGroupPermissions(groupPermissions)
                .nonce("4")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.setGroupPermissions).toStrictEqual(groupPermissions);
        });

        it("should ser/deser correctly with only allow permissions", () => {
            const groupPermissions: IGuardianGroupPermissionsAsset = { ...groupPermission };
            delete groupPermissions.allow;

            const actual = new GuardianGroupPermissionsBuilder()
                .GuardianGroupPermissions(groupPermissions)
                .nonce("4")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.setGroupPermissions).toStrictEqual(groupPermissions);
        });

        it("should throw if asset is undefined", () => {
            const actual = new GuardianGroupPermissionsBuilder().GuardianGroupPermissions(groupPermission).nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign(passphrases[0])).toThrow();
        });
    });
});
