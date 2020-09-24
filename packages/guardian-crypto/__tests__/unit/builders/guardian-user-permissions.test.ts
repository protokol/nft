import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { GuardianUserPermissionsBuilder } from "../../../src/builders";
import { PermissionKind } from "../../../src/enums";
import { GuardianUserPermissionsTransaction } from "../../../src/transactions";

const publicKey = "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d";

describe("Guardian User Permissions tests ", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(GuardianUserPermissionsTransaction);

        it("should verify correctly", () => {
            const actual = new GuardianUserPermissionsBuilder()
                .GuardianUserPermissions({
                    groupNames: ["group name"],
                    publicKey,
                    permissions: [
                        { types: [{ transactionType: 9000, transactionTypeGroup: 0 }], kind: PermissionKind.Allow },
                    ],
                })
                .vendorField("guardian-user-permissions transaction")
                .nonce("4")
                .sign(passphrases[0]);

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new GuardianUserPermissionsBuilder();
            actual.data.asset = undefined;

            const result = actual.GuardianUserPermissions({
                publicKey,
            });

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
