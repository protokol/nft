import nock from "nock";

export const mockExchangeConfigurations = (host: string) => {
    nock(host)
        .get("/nft/exchange/configurations")
        .reply(200, {
            data: {
                package: {
                    name: "@protokol/nft-exchange-api",
                    currentVersion: "1.0.0",
                    latestVersion: "1.0.0",
                },
                crypto: {
                    defaults: {
                        nftExchangeTypeGroup: 9001,
                        nftAuction: {
                            minItems: 1,
                            maxItems: 10,
                        },
                    },
                },
                transactions: {
                    defaults: {
                        feeType: 0,
                    },
                },
            },
        });
};
