import nock from "nock";

import { mockPagination } from "../pagination";
export const mockCollections = (host: string) => {
    nock(host)
        .get("/nft/collections")
        .reply(200, {
            meta: mockPagination(
                true,
                1,
                1,
                1,
                null,
                null,
                "/nft/collections?page=1&limit=100&transform=true",
                "/nft/collections?page=1&limit=100&transform=true",
                "/nft/collections?page=1&limit=100&transform=true",
            ),
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
};
