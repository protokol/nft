import "jest-extended";

import { Assets } from "../../../../src/resources/nft/base/assets";
import { configureBaseMocks } from "../../../mocks/nft/base";

const resource: Assets = configureBaseMocks<Assets>(Assets);

describe("API - 1.0 - Base/Resources - Assets", () => {
	it('should call \\"all\\" method', async () => {
		const response = await resource.all();

		expect(response.status).toBe(200);

		// Pagination
		// expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
		expect(response.body.meta.count).toBe(1);
		expect(response.body.meta.pageCount).toBe(1);
		expect(response.body.meta.totalCount).toBe(1);
		expect(response.body.meta.next).toBeNull();
		expect(response.body.meta.previous).toBeNull();
		expect(response.body.meta.self).toBe("/nft/assets?page=1&limit=100&transform=true");
		expect(response.body.meta.first).toBe("/nft/assets?page=1&limit=100&transform=true");
		expect(response.body.meta.last).toBe("/nft/assets?page=1&limit=100&transform=true");

		// Data
		expect(response.body.data[0].id).toBe("ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe");
		expect(response.body.data[0].ownerPublicKey).toBe(
			"0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
		);
		expect(response.body.data[0].senderPublicKey).toBe(
			"0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
		);
		expect(response.body.data[0].collectionId).toStrictEqual(
			"73e00a64a47c758d8d227163a24901b05c86e0e7b466c02596ad6eeff92d3147",
		);
		expect(response.body.data[0].attributes).toStrictEqual({
			name: "name",
			pac: 1,
			sho: 2,
			pas: 3,
		});
		expect(response.body.data[0].timestamp.epoch).toStrictEqual(108972496);
		expect(response.body.data[0].timestamp.unix).toStrictEqual(1599073696);
		expect(response.body.data[0].timestamp.human).toStrictEqual("2020-09-02T19:08:16.000Z");
	});

	it('should call \\"get\\" method', async () => {
		const response = await resource.get("ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe");

		expect(response.status).toBe(200);

		// Data
		expect(response.body.data.id).toBe("ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe");
		expect(response.body.data.ownerPublicKey).toBe(
			"0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
		);
		expect(response.body.data.senderPublicKey).toBe(
			"0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
		);
		expect(response.body.data.collectionId).toStrictEqual(
			"73e00a64a47c758d8d227163a24901b05c86e0e7b466c02596ad6eeff92d3147",
		);
		expect(response.body.data.attributes).toStrictEqual({
			name: "name",
			pac: 1,
			sho: 2,
			pas: 3,
		});
		expect(response.body.data.timestamp.epoch).toStrictEqual(108972496);
		expect(response.body.data.timestamp.unix).toStrictEqual(1599073696);
		expect(response.body.data.timestamp.human).toStrictEqual("2020-09-02T19:08:16.000Z");
	});

	it('should call \\"wallet\\" method', async () => {
		const response = await resource.wallet("ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe");

		expect(response.status).toBe(200);

		// Data
		expect(response.body.data.address).toStrictEqual("AcmXmomxpP8NahbbFivq32QmLuKFkTkqRg");
		expect(response.body.data.publicKey).toStrictEqual(
			"0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
		);
		expect(response.body.data.nft.collections).toBeArray();
		expect(response.body.data.nft.collections[0]).toBeObject();
		expect(response.body.data.nft.assetsIds[0]).toStrictEqual(
			"ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe",
		);
	});

	it('should call \\"searchByAsset\\" method', async () => {
		const response = await resource.searchByAsset({
			name: "Antonio Caracciolo",
		});

		expect(response.status).toBe(200);

		// Pagination
		// expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
		expect(response.body.meta.count).toBe(1);
		expect(response.body.meta.pageCount).toBe(1);
		expect(response.body.meta.totalCount).toBe(1);
		expect(response.body.meta.next).toBeNull();
		expect(response.body.meta.previous).toBeNull();
		expect(response.body.meta.self).toBe("/nft/assets/search?page=1&limit=100&transform=true");
		expect(response.body.meta.first).toBe("/nft/assets/search?page=1&limit=100&transform=true");
		expect(response.body.meta.last).toBe("/nft/assets/search?page=1&limit=100&transform=true");

		// Data
		expect(response.body.data[0].id).toBe("1eeef6bac21a47cc33f897ee1f4e3eb2357108e859c614acd1a99e0a1cc5a117");
		expect(response.body.data[0].ownerPublicKey).toBe(
			"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
		);
		expect(response.body.data[0].senderPublicKey).toBe(
			"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
		);
		expect(response.body.data[0].collectionId).toStrictEqual(
			"6c456c5687b1ca1b9a89457bc26dc8a7223694084a8f89cf295fc688f5a3342b",
		);
		expect(response.body.data[0].attributes).toStrictEqual({
			name: "Antonio Caracciolo",
			pac: 90,
			sho: 65,
			pas: 23,
			dri: 32,
			def: 21,
			phy: 12,
		});
		expect(response.body.data[0].timestamp.epoch).toStrictEqual(105740128);
		expect(response.body.data[0].timestamp.unix).toStrictEqual(1595841328);
		expect(response.body.data[0].timestamp.human).toStrictEqual("2020-07-27T09:15:28.000Z");
	});
});
