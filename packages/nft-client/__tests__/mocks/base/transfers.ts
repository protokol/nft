import nock from "nock";

import { mockPagination } from "../pagination";

export const mockTransfers = (host: string) => {
    nock(host)
        .get("/nft/transfers")
        .reply(200, {
            meta: mockPagination(
                true,
                1,
                1,
                1,
                null,
                null,
                "/nft/transfers?page=1&limit=100&transform=true",
                "/nft/transfers?page=1&limit=100&transform=true",
                "/nft/transfers?page=1&limit=100&transform=true",
            ),
            data: [
                {
                    id: "e1bd043715040cc1622ab19a3527bdcb760f5c08764ec0759fa07518902e03fc",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    nftTransfer: {
                        nftIds: ["7373bbe5524898faec40bfcd12c6161981771f3be6426404208784831f4b0d02"],
                        recipientId: "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
                    },
                    timestamp: {
                        epoch: 102725304,
                        unix: 1592826504,
                        human: "2020-06-22T11:48:24.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/transfers/e1bd043715040cc1622ab19a3527bdcb760f5c08764ec0759fa07518902e03fc")
        .reply(200, {
            data: {
                id: "e1bd043715040cc1622ab19a3527bdcb760f5c08764ec0759fa07518902e03fc",
                senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                nftTransfer: {
                    nftIds: ["7373bbe5524898faec40bfcd12c6161981771f3be6426404208784831f4b0d02"],
                    recipientId: "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
                },
                timestamp: {
                    epoch: 102725304,
                    unix: 1592826504,
                    human: "2020-06-22T11:48:24.000Z",
                },
            },
        });
};
