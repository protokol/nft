import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";
import { Enums } from "@protokol/guardian-crypto";

import * as support from "../__support__";
import { GuardianTransactionFactory } from "../__support__/transaction-factory";

const groupPermissionsAsset = {
    name: "group name",
    priority: 1,
    default: false,
    active: true,
    allow: [
        {
            transactionType: Enums.GuardianTransactionTypes.GuardianSetGroupPermissions,
            transactionTypeGroup: Enums.GuardianTransactionGroup,
        },
    ],
};

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Guardian set group permissions functional tests - Signed with one Passphrase", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        // Set group permissions
        const setGroupPermissions = GuardianTransactionFactory.initialize(app)
            .GuardianSetGroupPermissions(groupPermissionsAsset)
            .withPassphrase(passphrases[0])
            .createOne();

        await expect(setGroupPermissions).toBeAccepted();
        await snoozeForBlock(1);
        await expect(setGroupPermissions.id).toBeForged();
    });
});
