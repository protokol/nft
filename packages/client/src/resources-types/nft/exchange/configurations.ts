export interface ExchangeConfigurations {
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
            feeType: number;
        };
    };
}
