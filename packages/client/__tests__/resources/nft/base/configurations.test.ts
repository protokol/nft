import "jest-extended";

import { Configurations } from "../../../../src/resources/nft/base/configurations";
import { configureBaseMocks } from "../../../mocks/nft/base";

const resource: Configurations = configureBaseMocks<Configurations>(Configurations);

describe("API - 1.0 - Base/Resources - Configurations", () => {
	it('should call \\"index\\" method', async () => {
		const response = await resource.index();

		expect(response.status).toBe(200);

		// Package responses
		expect(response.body.data.package.name).toBe("@protokol/nft-base-api");
		expect(response.body.data.package.currentVersion).toBe("1.0.0");
		expect(response.body.data.package.latestVersion).toBe("1.0.0");

		//Crypto responses
		expect(response.body.data.crypto.defaults).toStrictEqual({
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
		});

		// Transactions responses
		expect(response.body.data.transactions.defaults).toStrictEqual({
			authorizedRegistrators: ["022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0"],
		});
	});
});
