import nock from "nock";

export const mockCollections = (host: string) => {
    nock(host)
        .get("/nft/collections")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/collections?page=1&limit=100&transform=true",
                first: "/nft/collections?page=1&limit=100&transform=true",
                last: "/nft/collections?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55",
                    senderPublicKey: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
                    name: "FIFA-20-PLAYERS",
                    description: "FIFA-20-PLAYERS cards",
                    maximumSupply: 100,
                    jsonSchema: {
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
                    },
                    timestamp: {
                        epoch: 105910672,
                        unix: 1596011872,
                        human: "2020-07-29T08:37:52.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/collections/e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55")
        .reply(200, {
            data: {
                id: "e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55",
                senderPublicKey: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
                name: "FIFA-20-PLAYERS",
                description: "FIFA-20-PLAYERS cards",
                maximumSupply: 100,
                jsonSchema: {
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
                },
            },
        });

    nock(host)
        .get("/nft/collections/e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55/schema")
        .reply(200, {
            data: {
                id: "e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55",
                senderPublicKey: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
                jsonSchema: {
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
                },
            },
        });

    nock(host)
        .get("/nft/collections/bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe/wallets")
        .reply(200, {
            data: {
                address: "AV6GP5qhhsZG6MHb4gShy22doUnVjEKHcN",
                publicKey: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
                nft: {
                    collections: [
                        {
                            collectionId: "bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe",
                            currentSupply: 2,
                            nftCollectionAsset: {
                                name: "FIFA-20-PLAYERS",
                                description: "FIFA-20-PLAYERS cards",
                                maximumSupply: 10,
                                jsonSchema: {
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
                                },
                            },
                        },
                    ],
                    assetsIds: ["81dec36220efe4dbcbe957d8abb8a04193f132b9ca20035438d815d2ffd090f7"],
                },
            },
        });

    nock(host)
        .post("/nft/collections/search", {
            jsonSchema: {
                properties: {
                    name: {
                        type: "string",
                    },
                },
            },
        })
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/collections/search?page=1&limit=100&transform=true",
                first: "/nft/collections/search?page=1&limit=100&transform=true",
                last: "/nft/collections/search?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55",
                    senderPublicKey: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
                    name: "FIFA-20-PLAYERS",
                    description: "FIFA-20-PLAYERS cards",
                    maximumSupply: 100,
                    jsonSchema: {
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
                    },
                    timestamp: {
                        epoch: 105910672,
                        unix: 1596011872,
                        human: "2020-07-29T08:37:52.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/collections/bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe/assets")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self:
                    "/nft/collections/bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe/assets?page=1&limit=100&transform=true",
                first:
                    "/nft/collections/bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe/assets?page=1&limit=100&transform=true",
                last:
                    "/nft/collections/bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe/assets?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "70faaab7da6bf93f4a8b494b66304d7a4841ecae2336ee0a4456e8d796e1d411",
                    ownerPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    collectionId: "bc045f0a977d368735030c7eadaa45de5581c1ffb2b0e9e93752c82579c516fe",
                    attributes: {
                        name: "Antonio Caracciolo",
                        pac: 90,
                        sho: 65,
                        pas: 23,
                        dri: 32,
                        def: 21,
                        phy: 12,
                    },
                    timestamp: {
                        epoch: 105910672,
                        unix: 1596011872,
                        human: "2020-07-29T08:37:52.000Z",
                    },
                },
            ],
        });
};
