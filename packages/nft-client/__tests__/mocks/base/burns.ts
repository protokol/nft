import nock from "nock";

export const mockBurns = (host: string) => {
    nock(host)
        .get("/nft/burns")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/burns?page=1&limit=100&transform=true",
                first: "/nft/burns?page=1&limit=100&transform=true",
                last: "/nft/burns?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "e2bcb7183940b6998701c467077c419b2cdc84eddcfbe632ce1473cda0e5b8e3",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    nftBurn: {
                        nftId: "6f252f11b119e00a5364d37670623d1b6be562f577984c819237ca4668e2897e",
                    },
                    timestamp: {
                        epoch: 102725680,
                        unix: 1592826880,
                        human: "2020-06-22T11:54:40.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/burns/e2bcb7183940b6998701c467077c419b2cdc84eddcfbe632ce1473cda0e5b8e3")
        .reply(200, {
            data: {
                id: "e2bcb7183940b6998701c467077c419b2cdc84eddcfbe632ce1473cda0e5b8e3",
                senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                nftBurn: {
                    nftId: "6f252f11b119e00a5364d37670623d1b6be562f577984c819237ca4668e2897e",
                },
                timestamp: {
                    epoch: 102725680,
                    unix: 1592826880,
                    human: "2020-06-22T11:54:40.000Z",
                },
            },
        });
};
