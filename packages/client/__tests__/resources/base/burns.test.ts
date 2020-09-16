import "jest-extended";

import { Burns } from "../../../src/resources/nft/base/burns";
import { configureBaseMocks } from "../../mocks/base";

const resource: Burns = configureBaseMocks<Burns>(Burns);

describe("API - 1.0 - Base/Resources - Burns", () => {
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
        expect(response.body.meta.self).toBe("/nft/burns?page=1&limit=100&transform=true");
        expect(response.body.meta.first).toBe("/nft/burns?page=1&limit=100&transform=true");
        expect(response.body.meta.last).toBe("/nft/burns?page=1&limit=100&transform=true");

        // Data
        expect(response.body.data[0].id).toBe("e2bcb7183940b6998701c467077c419b2cdc84eddcfbe632ce1473cda0e5b8e3");
        expect(response.body.data[0].senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data[0].nftBurn.nftId).toStrictEqual(
            "6f252f11b119e00a5364d37670623d1b6be562f577984c819237ca4668e2897e",
        );
        expect(response.body.data[0].timestamp.epoch).toStrictEqual(102725680);
        expect(response.body.data[0].timestamp.unix).toStrictEqual(1592826880);
        expect(response.body.data[0].timestamp.human).toStrictEqual("2020-06-22T11:54:40.000Z");
    });

    it('should call \\"get\\" method', async () => {
        const response = await resource.get("e2bcb7183940b6998701c467077c419b2cdc84eddcfbe632ce1473cda0e5b8e3");

        expect(response.status).toBe(200);

        // Data
        expect(response.body.data.id).toBe("e2bcb7183940b6998701c467077c419b2cdc84eddcfbe632ce1473cda0e5b8e3");
        expect(response.body.data.senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data.nftBurn.nftId).toStrictEqual(
            "6f252f11b119e00a5364d37670623d1b6be562f577984c819237ca4668e2897e",
        );
        expect(response.body.data.timestamp.epoch).toStrictEqual(102725680);
        expect(response.body.data.timestamp.unix).toStrictEqual(1592826880);
        expect(response.body.data.timestamp.human).toStrictEqual("2020-06-22T11:54:40.000Z");
    });
});
