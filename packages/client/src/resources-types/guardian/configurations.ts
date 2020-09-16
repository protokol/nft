export interface GuardianConfigurations {
    data: {
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
            };
        };
        transactions: {
            defaults: {
                maxDefinedGroupsPerUser: number;
                defaultRuleBehaviour: number;
            };
        };
    };
}
