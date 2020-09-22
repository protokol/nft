export interface GuardianConfigurations {
    package: {
        name: string;
        currentVersion: string;
        latestVersion: string;
    };
    crypto: {
        defaults: {
            guardianTypeGroup: number;
            version: number;
            guardianGroupName: {
                minLength: number;
                maxLength: number;
            };
            guardianGroupPriority: {
                min: number;
                max: number;
            };
        };
    };
    transactions: {
        defaults: {
            maxDefinedGroupsPerUser: number;
            defaultRuleBehaviour: number;
        };
    };
}
