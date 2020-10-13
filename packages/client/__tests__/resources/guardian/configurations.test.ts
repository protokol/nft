import "jest-extended";

import { Configurations } from "../../../src/resources/guardian/configurations";
import { configureGuardianMocks } from "../../mocks/guardian";

const resource: Configurations = configureGuardianMocks<Configurations>(Configurations);

describe("API - 1.0 - Guardian/Resources - Configurations", () => {
    it('should call \\"index\\" method', async () => {
        const response = await resource.index();

        expect(response.status).toBe(200);

        // Package responses
        expect(response.body.data.package.name).toBe("@protokol/guardian-api");
        expect(response.body.data.package.currentVersion).toBe("1.0.0");
        expect(response.body.data.package.latestVersion).toBe("1.0.0");

        //Crypto responses
        expect(response.body.data.crypto).toStrictEqual({
            defaults: {
                guardianTypeGroup: 9002,
                version: 2,
                guardianGroupName: {
                    minLength: 1,
                    maxLength: 40,
                },
                guardianGroupPriority: {
                    min: 0,
                    max: 1000,
                },
            },
        });

        // Transactions responses
        expect(response.body.data.transactions).toStrictEqual({
            defaults: {
                maxDefinedGroupsPerUser: 20,
                transactionsAllowedByDefault: true,
                masterPublicKey: "",
                feeType: 0,
            },
        });
    });
});
