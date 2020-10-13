import nock from "nock";

export const mockGuardianConfigurations = (host: string) => {
    nock(host)
        .get("/guardian/configurations")
        .reply(200, {
            data: {
                package: {
                    name: "@protokol/guardian-api",
                    currentVersion: "1.0.0",
                    latestVersion: "1.0.0",
                },
                crypto: {
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
                },
                transactions: {
                    defaults: {
                        maxDefinedGroupsPerUser: 20,
                        transactionsAllowedByDefault: true,
                        masterPublicKey: "",
                        feeType: 0,
                    },
                },
            },
        });
};
