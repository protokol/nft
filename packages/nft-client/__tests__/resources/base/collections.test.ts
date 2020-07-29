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

        //timestamp
        expect(response.body.data[0].timestamp.epoch).toBe(105910672);
        expect(response.body.data[0].timestamp.unix).toBe(1596011872);
        expect(response.body.data[0].timestamp.human).toBe("2020-07-29T08:37:52.000Z");
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

    it('should test get wallet - "wallet" ', async () => {
        const response = await resource.wallet("bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe");

        expect(response.status).toBe(200);

        // Wallet info
        expect(response.body.data.address).toBe("AV6GP5qhhsZG6MHb4gShy22doUnVjEKHcN");
        expect(response.body.data.publicKey).toBe("022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0");

        // Data
        expect(response.body.data.nft.collections[0].collectionId).toBe(
            "bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe",
        );
        expect(response.body.data.nft.collections[0].currentSupply).toBe(2);
        expect(response.body.data.nft.collections[0].nftCollectionAsset.name).toBe("FIFA-20-PLAYERS");
        expect(response.body.data.nft.collections[0].nftCollectionAsset.description).toBe("FIFA-20-PLAYERS cards");
        expect(response.body.data.nft.collections[0].nftCollectionAsset.maximumSupply).toBe(10);
        expect(response.body.data.nft.collections[0].nftCollectionAsset.jsonSchema).toStrictEqual({
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

        expect(response.body.data.nft.assetsIds).toStrictEqual([
            "81dec36220efe4dbcbe957d8abb8a04193f132b9ca20035438d815d2ffd090f7",
        ]);
    });

    it('should test post searchByCollections - "searchByCollections" ', async () => {
        const response = await resource.searchByCollections({
            jsonSchema: {
                properties: {
                    name: {
                        type: "string",
                    },
                },
            },
        });

        expect(response.status).toBe(200);

        // Pagination
        // expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
        expect(response.body.meta.count).toBe(1);
        expect(response.body.meta.pageCount).toBe(1);
        expect(response.body.meta.totalCount).toBe(1);
        expect(response.body.meta.next).toBeNull();
        expect(response.body.meta.previous).toBeNull();
        expect(response.body.meta.self).toBe("/nft/collections/search?page=1&limit=100&transform=true");
        expect(response.body.meta.first).toBe("/nft/collections/search?page=1&limit=100&transform=true");
        expect(response.body.meta.last).toBe("/nft/collections/search?page=1&limit=100&transform=true");

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

        //timestamp
        expect(response.body.data[0].timestamp.epoch).toBe(105910672);
        expect(response.body.data[0].timestamp.unix).toBe(1596011872);
        expect(response.body.data[0].timestamp.human).toBe("2020-07-29T08:37:52.000Z");
    });

    it('should search asset by collection id - "assetByCollectionId"', async () => {
        const response = await resource.assetByCollectionId(
            "bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe",
        );

        expect(response.status).toBe(200);

        // Pagination
        // expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
        expect(response.body.meta.count).toBe(1);
        expect(response.body.meta.pageCount).toBe(1);
        expect(response.body.meta.totalCount).toBe(1);
        expect(response.body.meta.next).toBeNull();
        expect(response.body.meta.previous).toBeNull();
        expect(response.body.meta.self).toBe(
            "/nft/collections/bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe/assets?page=1&limit=100&transform=true",
        );
        expect(response.body.meta.first).toBe(
            "/nft/collections/bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe/assets?page=1&limit=100&transform=true",
        );
        expect(response.body.meta.last).toBe(
            "/nft/collections/bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe/assets?page=1&limit=100&transform=true",
        );

        // Data
        expect(response.body.data[0].id).toBe("70faaab7da6bf93f4a8b494b66304d7a4841ecae2336ee0a4456e8d796e1d411");
        expect(response.body.data[0].ownerPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data[0].senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data[0].collectionId).toBe(
            "bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe",
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

        //timestamp
        expect(response.body.data[0].timestamp.epoch).toBe(105910672);
        expect(response.body.data[0].timestamp.unix).toBe(1596011872);
        expect(response.body.data[0].timestamp.human).toBe("2020-07-29T08:37:52.000Z");
    });
});
