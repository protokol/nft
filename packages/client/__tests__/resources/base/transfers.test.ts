import "jest-extended";

import { Transfers } from "../../../src/resources/nft/base/transfers";
import { configureBaseMocks } from "../../mocks/base";

const resource: Transfers = configureBaseMocks<Transfers>(Transfers);

describe("API - 1.0 - Base/Resources - Transfers", () => {
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
        expect(response.body.meta.self).toBe("/nft/transfers?page=1&limit=100&transform=true");
        expect(response.body.meta.first).toBe("/nft/transfers?page=1&limit=100&transform=true");
        expect(response.body.meta.last).toBe("/nft/transfers?page=1&limit=100&transform=true");

        // Data
        expect(response.body.data[0].id).toBe("e1bd043715040cc1622ab19a3527bdcb760f5c08764ec0759fa07518902e03fc");
        expect(response.body.data[0].senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data[0].nftTransfer.nftIds).toStrictEqual([
            "7373bbe5524898faec40bfcd12c6161981771f3be6426404208784831f4b0d02",
        ]);
        expect(response.body.data[0].nftTransfer.recipientId).toStrictEqual("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        expect(response.body.data[0].timestamp.epoch).toStrictEqual(102725304);
        expect(response.body.data[0].timestamp.unix).toStrictEqual(1592826504);
        expect(response.body.data[0].timestamp.human).toStrictEqual("2020-06-22T11:48:24.000Z");
    });

    it('should call \\"get\\" method', async () => {
        const response = await resource.get("e1bd043715040cc1622ab19a3527bdcb760f5c08764ec0759fa07518902e03fc");

        expect(response.status).toBe(200);

        // Data
        expect(response.body.data.id).toBe("e1bd043715040cc1622ab19a3527bdcb760f5c08764ec0759fa07518902e03fc");
        expect(response.body.data.senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data.nftTransfer.nftIds).toStrictEqual([
            "7373bbe5524898faec40bfcd12c6161981771f3be6426404208784831f4b0d02",
        ]);
        expect(response.body.data.nftTransfer.recipientId).toStrictEqual("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        expect(response.body.data.timestamp.epoch).toStrictEqual(102725304);
        expect(response.body.data.timestamp.unix).toStrictEqual(1592826504);
        expect(response.body.data.timestamp.human).toStrictEqual("2020-06-22T11:48:24.000Z");
    });
});
