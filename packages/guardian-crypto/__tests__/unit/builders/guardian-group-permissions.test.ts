import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { GuardianGroupPermissionsBuilder } from "../../../src/builders";
import { GuardianGroupPermissionsTransaction } from "../../../src/transactions";

const groupPermission = {
    name: "group name",
    priority: 1,
    default: false,
    active: true,
    allow: [{ transactionType: 9000, transactionTypeGroup: 0 }],
};

describe("Guardian Group Permissions tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(GuardianGroupPermissionsTransaction);

        it("should verify correctly", () => {
            const actual = new GuardianGroupPermissionsBuilder()
                .GuardianGroupPermissions(groupPermission)
                .vendorField("guardian-group-permissions transaction")
                .nonce("4")
                .sign(passphrases[0]);

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new GuardianGroupPermissionsBuilder();
            actual.data.asset = undefined;

            const result = actual.GuardianGroupPermissions(groupPermission);

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
