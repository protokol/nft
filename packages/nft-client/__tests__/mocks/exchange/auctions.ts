import nock from "nock";

export const mockAuctions = (host: string) => {
    nock(host)
        .get("/nft/exchange/auctions")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/exchange/auctions?transform=true&page=1&limit=100",
                first: "/nft/exchange/auctions?transform=true&page=1&limit=100",
                last: "/nft/exchange/auctions?transform=true&page=1&limit=100",
            },
            data: [
                {
                    id: "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    nftAuction: {
                        nftIds: ["a8016c66d160606e289ed8bab6ce2b2d9916197111e8612257b10e54d83ba827"],
                        startAmount: "999",
                        expiration: {
                            blockHeight: 1000000,
                        },
                    },
                    timestamp: {
                        epoch: 102726648,
                        unix: 1592827848,
                        human: "2020-06-22T12:10:48.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/exchange/auctions/d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a")
        .reply(200, {
            data: {
                id: "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
                senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                nftAuction: {
                    nftIds: ["a8016c66d160606e289ed8bab6ce2b2d9916197111e8612257b10e54d83ba827"],
                    startAmount: "999",
                    expiration: {
                        blockHeight: 1000000,
                    },
                },
                timestamp: {
                    epoch: 102726648,
                    unix: 1592827848,
                    human: "2020-06-22T12:10:48.000Z",
                },
            },
        });

    nock(host)
        .get("/nft/exchange/auctions/717ce9f6dff858c4972b067a1fce8ea72fb1c4ac60c4a75cc8e9993dbbe7541a/wallets")
        .reply(200, {
            data: {
                address: "AV6GP5qhhsZG6MHb4gShy22doUnVjEKHcN",
                publicKey: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
                nft: {
                    collections: [
                        {
                            collectionId: "e38324971ab923b6d74693448cad180207b4aa99ca4f5c20625dc290cd8b7e55",
                            currentSupply: 4,
                            nftCollectionAsset: {
                                name: "FIFA-20-PLAYERS",
                                description: "FIFA 2020 Players",
                                maximumSupply: 99,
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
                    auctions: [
                        {
                            auctionId: "717ce9f6dff858c4972b067a1fce8ea72fb1c4ac60c4a75cc8e9993dbbe7541a",
                            nftIds: ["283ef247a5bdd934f23680b3c85825ac20ab5a6f71ca0757633ae65b02df0bc8"],
                            bids: ["a1588c8e291574e918ebb28b3390dc65186801ff852ebd5292600c34692f9d13"],
                        },
                    ],
                    lockedBalance: "0",
                },
            },
        });

    nock(host)
        .post("/nft/exchange/auctions/search")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/exchange/auctions/search?page=1&limit=100&transform=true",
                first: "/nft/exchange/auctions/search?page=1&limit=100&transform=true",
                last: "/nft/exchange/auctions/search?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    nftAuction: {
                        nftIds: ["a8016c66d160606e289ed8bab6ce2b2d9916197111e8612257b10e54d83ba827"],
                        startAmount: "999",
                        expiration: {
                            blockHeight: 1000000,
                        },
                    },
                    timestamp: {
                        epoch: 102726648,
                        unix: 1592827848,
                        human: "2020-06-22T12:10:48.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/exchange/auctions/canceled")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/exchange/auctions/canceled?page=1&limit=100&transform=true",
                first: "/nft/exchange/auctions/canceled?page=1&limit=100&transform=true",
                last: "/nft/exchange/auctions/canceled?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "808a080c53dcc77ec01ce0fe76598b4b3d1bacfabee082dada636784b115a150",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    nftAuctionCancel: {
                        auctionId: "58dc9625ff7190dc3ff2dbf541a2bb2c8a85366f2cbe95d21ec9b8970f41d086",
                    },
                    timestamp: {
                        epoch: 102726256,
                        unix: 1592827456,
                        human: "2020-06-22T12:04:16.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/exchange/auctions/canceled/808a080c53dcc77ec01ce0fe76598b4b3d1bacfabee082dada636784b115a150")
        .reply(200, {
            data: {
                id: "808a080c53dcc77ec01ce0fe76598b4b3d1bacfabee082dada636784b115a150",
                senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                nftAuctionCancel: {
                    auctionId: "58dc9625ff7190dc3ff2dbf541a2bb2c8a85366f2cbe95d21ec9b8970f41d086",
                },
                timestamp: {
                    epoch: 102726256,
                    unix: 1592827456,
                    human: "2020-06-22T12:04:16.000Z",
                },
            },
        });
};
