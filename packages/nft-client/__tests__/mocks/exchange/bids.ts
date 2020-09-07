import nock from "nock";

export const mockBids = (host: string) => {
    nock(host)
        .get("/nft/exchange/bids")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/exchange/bids?page=1&limit=100&transform=true",
                first: "/nft/exchange/bids?page=1&limit=100&transform=true",
                last: "/nft/exchange/bids?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "a1588c8e291574e918ebb28b3390dc65186801ff852ebd5292600c34692f9d13",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    nftBid: {
                        auctionId: "717ce9f6dff858c4972b067a1fce8ea72fb1c4ac60c4a75cc8e9993dbbe7541a",
                        bidAmount: "1223",
                    },
                    timestamp: {
                        epoch: 102881224,
                        unix: 1592982424,
                        human: "2020-06-24T07:07:04.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/exchange/bids/a1588c8e291574e918ebb28b3390dc65186801ff852ebd5292600c34692f9d13")
        .reply(200, {
            data: {
                id: "a1588c8e291574e918ebb28b3390dc65186801ff852ebd5292600c34692f9d13",
                senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                nftBid: {
                    auctionId: "717ce9f6dff858c4972b067a1fce8ea72fb1c4ac60c4a75cc8e9993dbbe7541a",
                    bidAmount: "1223",
                },
                timestamp: {
                    epoch: 102881224,
                    unix: 1592982424,
                    human: "2020-06-24T07:07:04.000Z",
                },
            },
        });

    nock(host)
        .get("/nft/exchange/bids/123/wallets")
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
        .post("/nft/exchange/bids/search")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/exchange/bids/search?page=1&limit=100&transform=true",
                first: "/nft/exchange/bids/search?page=1&limit=100&transform=true",
                last: "/nft/exchange/bids/search?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "032383b3f5c541c117c3409fdb1545e7b34deb0f6922ef7a42c40867d24402d8",
                    senderPublicKey: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
                    nftBid: {
                        auctionId: "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
                        bidAmount: "1223",
                    },
                    timestamp: {
                        epoch: 102726688,
                        unix: 1592827888,
                        human: "2020-06-22T12:11:28.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/exchange/bids/canceled")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/exchange/bids/canceled?page=1&limit=100&transform=true",
                first: "/nft/exchange/bids/canceled?page=1&limit=100&transform=true",
                last: "/nft/exchange/bids/canceled?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "36969b0e9578dc7ce22b4db16bc8d40b2fdb50e4d94b26fbb5f7f0a4e30d2d21",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    nftBidCancel: {
                        bidId: "c67beef6edc35f81334e8bf825dbc735e8d579f8297509d74980756b9b9ff8fe",
                    },
                    timestamp: {
                        epoch: 102726536,
                        unix: 1592827736,
                        human: "2020-06-22T12:08:56.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/exchange/bids/canceled/36969b0e9578dc7ce22b4db16bc8d40b2fdb50e4d94b26fbb5f7f0a4e30d2d21")
        .reply(200, {
            data: {
                id: "36969b0e9578dc7ce22b4db16bc8d40b2fdb50e4d94b26fbb5f7f0a4e30d2d21",
                senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                nftBidCancel: {
                    bidId: "c67beef6edc35f81334e8bf825dbc735e8d579f8297509d74980756b9b9ff8fe",
                },
                timestamp: {
                    epoch: 102726536,
                    unix: 1592827736,
                    human: "2020-06-22T12:08:56.000Z",
                },
            },
        });
};
