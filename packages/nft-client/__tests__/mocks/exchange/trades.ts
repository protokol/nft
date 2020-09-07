import nock from "nock";

export const mockTrades = (host: string) => {
    nock(host)
        .get("/nft/exchange/trades")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/exchange/trades?page=1&limit=100&transform=true",
                first: "/nft/exchange/trades?page=1&limit=100&transform=true",
                last: "/nft/exchange/trades?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "6a63192e55a62d4dc98ac335054dc928e62bad3a46948446e32f1d7e56b11fd3",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    completedTrade: {
                        auctionId: "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
                        bidId: "032383b3f5c541c117c3409fdb1545e7b34deb0f6922ef7a42c40867d24402d8",
                    },
                    timestamp: {
                        epoch: 102726736,
                        unix: 1592827936,
                        human: "2020-06-22T12:12:16.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/exchange/trades/6a63192e55a62d4dc98ac335054dc928e62bad3a46948446e32f1d7e56b11fd3")
        .reply(200, {
            data: {
                id: "6a63192e55a62d4dc98ac335054dc928e62bad3a46948446e32f1d7e56b11fd3",
                senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                completedTrade: {
                    auction: {
                        id: "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
                        nftIds: ["a8016c66d160606e289ed8bab6ce2b2d9916197111e8612257b10e54d83ba827"],
                        startAmount: "999",
                        expiration: {
                            blockHeight: 1000000,
                        },
                    },
                    bid: {
                        id: "032383b3f5c541c117c3409fdb1545e7b34deb0f6922ef7a42c40867d24402d8",
                        auctionId: "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
                        bidAmount: "1223",
                    },
                },
                timestamp: {
                    epoch: 102726736,
                    unix: 1592827936,
                    human: "2020-06-22T12:12:16.000Z",
                },
            },
        });

    nock(host)
        .post("/nft/exchange/trades/search")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/exchange/trades/search?page=1&limit=100&transform=true",
                first: "/nft/exchange/trades/search?page=1&limit=100&transform=true",
                last: "/nft/exchange/trades/search?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "b55750470dfb3e98a8a7acd4d1e933ab20db1ddd18343b7f6ddaa2a4395a9d06",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    completedTrade: {
                        auctionId: "4acf50de691a6173a07ccb769381003685ebbdb2dbc9d7601baa882cc9bbfd56",
                        bidId: "405d07d0b41c7a279cab832c267d3be0e5947bdf89156103865e8a290d4e907a",
                    },
                    timestamp: {
                        epoch: 105743104,
                        unix: 1595844304,
                        human: "2020-07-27T10:05:04.000Z",
                    },
                },
            ],
        });
};
