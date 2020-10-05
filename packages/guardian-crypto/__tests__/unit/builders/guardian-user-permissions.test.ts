import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { GuardianUserPermissionsBuilder } from "../../../src/builders";
import { GuardianUserPermissionsTransaction } from "../../../src/transactions";

const userPermission = {
    groupNames: ["group name"],
    publicKey: "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
    allow: [{ transactionType: 9000, transactionTypeGroup: 0 }],
    deny: [{ transactionType: 9000, transactionTypeGroup: 0 }],
};

describe("Guardian User Permissions tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(GuardianUserPermissionsTransaction);

        it("should verify correctly", () => {
            const actual = new GuardianUserPermissionsBuilder()
                .GuardianUserPermissions(userPermission)
                .vendorField("guardian-user-permissions transaction")
                .nonce("4")
                .sign(passphrases[0]);

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new GuardianUserPermissionsBuilder();
            actual.data.asset = undefined;

            const result = actual.GuardianUserPermissions(userPermission);

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
