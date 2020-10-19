import nock from "nock";

export const mockBaseConfigurations = (host: string) => {
	nock(host)
		.get("/nft/configurations")
		.reply(200, {
			data: {
				package: {
					name: "@protokol/nft-base-api",
					currentVersion: "1.0.0",
					latestVersion: "1.0.0",
				},
				crypto: {
					defaults: {
						nftBaseTypeGroup: 9000,
						nftCollectionName: {
							minLength: 5,
							maxLength: 40,
						},
						nftCollectionDescription: {
							minLength: 5,
							maxLength: 80,
						},
						nftCollectionAllowedIssuers: {
							minItems: 1,
							maxItems: 10,
						},
						nftTransfer: {
							minItems: 1,
							maxItems: 10,
						},
					},
				},
				transactions: {
					defaults: {
						authorizedRegistrators: ["022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0"],
					},
				},
			},
		});
};
