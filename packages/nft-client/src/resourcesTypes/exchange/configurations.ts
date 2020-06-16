export interface Configurations {
    package: {
        name: string;
        currentVersion: string;
        latestVersion: string;
    };
    crypto: {
        defaults: {
            nftExchangeTypeGroup: number;
            nftAuction: {
                minItems: number;
                maxItems: number;
            };
        };
    };
    transactions: {
        defaults: {
            safetyDistance: number;
        };
    };
}
