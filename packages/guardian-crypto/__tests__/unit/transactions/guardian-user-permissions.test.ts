import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { GuardianUserPermissionsBuilder } from "../../../src/builders";
import { PermissionKind } from "../../../src/enums";
import { GuardianUserPermissionsTransaction } from "../../../src/transactions";

const publicKey = "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d";

describe("Guardian set user permissions tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(GuardianUserPermissionsTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly with group names and permissions", () => {
            const actual = new GuardianUserPermissionsBuilder()
                .GuardianUserPermissions({
                    groupNames: ["group name"],
                    publicKey,
                    permissions: [
                        { types: [{ transactionType: 9000, transactionTypeGroup: 0 }], kind: PermissionKind.Allow },
                    ],
                })
                .nonce("3")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.setUserPermissions).toStrictEqual({
                groupNames: ["group name"],
                publicKey,
                permissions: [
                    { types: [{ transactionType: 9000, transactionTypeGroup: 0 }], kind: PermissionKind.Allow },
                ],
            });
        });

        it("should ser/deser correctly without group names and permissions", () => {
            const actual = new GuardianUserPermissionsBuilder()
                .GuardianUserPermissions({
                    publicKey,
                })
                .nonce("3")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.setUserPermissions).toStrictEqual({
                publicKey,
            });
        });

        it("should throw if asset is undefined", () => {
            const actual = new GuardianUserPermissionsBuilder().GuardianUserPermissions({ publicKey }).nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign(passphrases[0])).toThrow();
        });
    });
});
