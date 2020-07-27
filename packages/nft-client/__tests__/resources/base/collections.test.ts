import "jest-extended";

import { Collections } from "../../../src/resources/base/collections";
import { configureMocks } from "../../mocks/base";

const resource: Collections = configureMocks<Collections>(Collections);

describe("Collections - resources/base/collections", () => {
    it('should test collections all - "all" ', async () => {
        const response = await resource.all();

        expect(response.status).toBe(200);

        // Pagination
        // expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
        expect(response.body.meta.count).toBe(1);
        expect(response.body.meta.pageCount).toBe(1);
        expect(response.body.meta.totalCount).toBe(1);
        expect(response.body.meta.next).toBeNull();
        expect(response.body.meta.previous).toBeNull();
        expect(response.body.meta.self).toBe("/nft/collections?page=1&limit=100&transform=true");
        expect(response.body.meta.first).toBe("/nft/collections?page=1&limit=100&transform=true");
        expect(response.body.meta.last).toBe("/nft/collections?page=1&limit=100&transform=true");

        // Data
        expect(response.body.data[0].id).toBe("e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55");
        expect(response.body.data[0].senderPublicKey).toBe(
            "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
        );
        expect(response.body.data[0].name).toBe("FIFA-20-PLAYERS");
        expect(response.body.data[0].description).toBe("FIFA-20-PLAYERS cards");
        expect(response.body.data[0].maximumSupply).toBe(100);
        expect(response.body.data[0].jsonSchema).toStrictEqual({
            properties: {
                name: {
                    type: "string",
                },
                pac: {
                    type: "number",
                },
                sho: {
                    type: "number",
                },
                pas: {
                    type: "number",
                },
                dri: {
                    type: "number",
                },
                def: {
                    type: "number",
                },
                phy: {
                    type: "number",
                },
            },
        });
    });

    it('should test collections return by id - "get" ', async () => {
        const response = await resource.get("e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55");

        expect(response.status).toBe(200);

        // Data
        expect(response.body.data.id).toBe("e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55");
        expect(response.body.data.senderPublicKey).toBe(
            "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
        );
        expect(response.body.data.name).toBe("FIFA-20-PLAYERS");
        expect(response.body.data.description).toBe("FIFA-20-PLAYERS cards");
        expect(response.body.data.maximumSupply).toBe(100);
        expect(response.body.data.jsonSchema).toStrictEqual({
            properties: {
                name: {
                    type: "string",
                },
                pac: {
                    type: "number",
                },
                sho: {
                    type: "number",
                },
                pas: {
                    type: "number",
                },
                dri: {
                    type: "number",
                },
                def: {
                    type: "number",
                },
                phy: {
                    type: "number",
                },
            },
        });
    });

    it('should test collections return schema by id - "getSchema" ', async () => {
        const response = await resource.getSchema("e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55");

        expect(response.status).toBe(200);

        // Data
        expect(response.body.data.id).toBe("e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55");
        expect(response.body.data.senderPublicKey).toBe(
            "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
        );
        expect(response.body.data.jsonSchema).toStrictEqual({
            properties: {
                name: {
                    type: "string",
                },
                pac: {
                    type: "number",
                },
                sho: {
                    type: "number",
                },
                pas: {
                    type: "number",
                },
                dri: {
                    type: "number",
                },
                def: {
                    type: "number",
                },
                phy: {
                    type: "number",
                },
            },
        });
    });
});
