import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { GuardianUserPermissionsBuilder } from "../../../src/builders";
import { IGuardianGroupPermissionsAsset, IGuardianUserPermissionsAsset } from "../../../src/interfaces";
import { GuardianUserPermissionsTransaction } from "../../../src/transactions";

const userPermission = {
    groupNames: ["group name"],
    publicKey: "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
    allow: [{ transactionType: 9000, transactionTypeGroup: 0 }],
    deny: [{ transactionType: 9000, transactionTypeGroup: 0 }],
};

describe("Guardian set user permissions tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(GuardianUserPermissionsTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly with group names and allow/deny permissions", () => {
            const actual = new GuardianUserPermissionsBuilder()
                .GuardianUserPermissions(userPermission)
                .nonce("3")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.setUserPermissions).toStrictEqual(userPermission);
        });

        it("should ser/deser correctly without group names and permissions", () => {
            const actual = new GuardianUserPermissionsBuilder()
                .GuardianUserPermissions({
                    publicKey: userPermission.publicKey,
                })
                .nonce("3")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.setUserPermissions).toStrictEqual({
                publicKey: userPermission.publicKey,
            });
        });

        it("should ser/deser correctly with only allow permissions", () => {
            const userPermissions: IGuardianUserPermissionsAsset = { ...userPermission };
            delete userPermissions.groupNames;
            delete userPermissions.deny;

            const actual = new GuardianUserPermissionsBuilder()
                .GuardianUserPermissions(userPermissions)
                .nonce("3")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.setUserPermissions).toStrictEqual(userPermissions);
        });

        it("should throw if asset is undefined", () => {
            const actual = new GuardianUserPermissionsBuilder().GuardianUserPermissions(userPermission).nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign(passphrases[0])).toThrow();
        });
    });
});
