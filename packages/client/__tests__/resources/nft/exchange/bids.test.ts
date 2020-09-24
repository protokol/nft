import "jest-extended";

import { Bids } from "../../../../src/resources/nft/exchange/bids";
import { configureExchangeMocks } from "../../../mocks/nft/exchange";

const resource: Bids = configureExchangeMocks<Bids>(Bids);

describe("API - 1.0 - Exchange/Resources - Bids", () => {
    it('should call \\"getAllBids\\" method', async () => {
        const response = await resource.getAllBids();

        expect(response.status).toBe(200);

        // Pagination
        // expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
        expect(response.body.meta.count).toBe(1);
        expect(response.body.meta.pageCount).toBe(1);
        expect(response.body.meta.totalCount).toBe(1);
        expect(response.body.meta.next).toBeNull();
        expect(response.body.meta.previous).toBeNull();
        expect(response.body.meta.self).toBe("/nft/exchange/bids?page=1&limit=100&transform=true");
        expect(response.body.meta.first).toBe("/nft/exchange/bids?page=1&limit=100&transform=true");
        expect(response.body.meta.last).toBe("/nft/exchange/bids?page=1&limit=100&transform=true");

        // Data
        expect(response.body.data[0].id).toBe("a1588c8e291574e918ebb28b3390dc65186801ff852ebd5292600c34692f9d13");
        expect(response.body.data[0].senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data[0].nftBid.auctionId).toStrictEqual(
            "717ce9f6dff858c4972b067a1fce8ea72fb1c4ac60c4a75cc8e9993dbbe7541a",
        );
        expect(response.body.data[0].nftBid.bidAmount).toStrictEqual("1223");
        expect(response.body.data[0].timestamp.epoch).toStrictEqual(102881224);
        expect(response.body.data[0].timestamp.unix).toStrictEqual(1592982424);
        expect(response.body.data[0].timestamp.human).toStrictEqual("2020-06-24T07:07:04.000Z");
    });

    it('should call \\"getBidById\\" method', async () => {
        const response = await resource.getBidById("a1588c8e291574e918ebb28b3390dc65186801ff852ebd5292600c34692f9d13");

        expect(response.status).toBe(200);

        // Data
        expect(response.body.data.id).toBe("a1588c8e291574e918ebb28b3390dc65186801ff852ebd5292600c34692f9d13");
        expect(response.body.data.senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data.nftBid.auctionId).toStrictEqual(
            "717ce9f6dff858c4972b067a1fce8ea72fb1c4ac60c4a75cc8e9993dbbe7541a",
        );
        expect(response.body.data.nftBid.bidAmount).toStrictEqual("1223");
        expect(response.body.data.timestamp.epoch).toStrictEqual(102881224);
        expect(response.body.data.timestamp.unix).toStrictEqual(1592982424);
        expect(response.body.data.timestamp.human).toStrictEqual("2020-06-24T07:07:04.000Z");
    });

    it('should call \\"getBidsWallets\\" method', async () => {
        const response = await resource.getBidsWallets("123");

        expect(response.status).toBe(200);

        // Data
        expect(response.body.data.address).toStrictEqual("AV6GP5qhhsZG6MHb4gShy22doUnVjEKHcN");
        expect(response.body.data.publicKey).toStrictEqual(
            "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
        );
        expect(response.body.data.nft.collections).toBeArray();
        expect(response.body.data.nft.collections[0]).toBeObject();
        expect(response.body.data.nft.lockedBalance).toStrictEqual("0");
        expect(response.body.data.nft.auctions).toStrictEqual([
            {
                auctionId: "717ce9f6dff858c4972b067a1fce8ea72fb1c4ac60c4a75cc8e9993dbbe7541a",
                nftIds: ["283ef247a5bdd934f23680b3c85825ac20ab5a6f71ca0757633ae65b02df0bc8"],
                bids: ["a1588c8e291574e918ebb28b3390dc65186801ff852ebd5292600c34692f9d13"],
            },
        ]);
    });

    it('should call \\"searchByBid\\" method', async () => {
        const response = await resource.searchByBid({
            senderPublicKey: "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
        });

        expect(response.status).toBe(200);

        // Pagination
        // expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
        expect(response.body.meta.count).toBe(1);
        expect(response.body.meta.pageCount).toBe(1);
        expect(response.body.meta.totalCount).toBe(1);
        expect(response.body.meta.next).toBeNull();
        expect(response.body.meta.previous).toBeNull();
        expect(response.body.meta.self).toBe("/nft/exchange/bids/search?page=1&limit=100&transform=true");
        expect(response.body.meta.first).toBe("/nft/exchange/bids/search?page=1&limit=100&transform=true");
        expect(response.body.meta.last).toBe("/nft/exchange/bids/search?page=1&limit=100&transform=true");

        // Data
        expect(response.body.data[0].id).toBe("032383b3f5c541c117c3409fdb1545e7b34deb0f6922ef7a42c40867d24402d8");
        expect(response.body.data[0].senderPublicKey).toBe(
            "022f2978d57f95c021b9d4bf082b482738ce392bcf6bc213710e7a21504cfeb5a0",
        );
        expect(response.body.data[0].nftBid.auctionId).toStrictEqual(
            "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
        );
        expect(response.body.data[0].nftBid.bidAmount).toStrictEqual("1223");
        expect(response.body.data[0].timestamp.epoch).toStrictEqual(102726688);
        expect(response.body.data[0].timestamp.unix).toStrictEqual(1592827888);
        expect(response.body.data[0].timestamp.human).toStrictEqual("2020-06-22T12:11:28.000Z");
    });

    it('should call \\"getAllCanceledBids\\" method', async () => {
        const response = await resource.getAllCanceledBids();

        expect(response.status).toBe(200);

        // Pagination
        // expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
        expect(response.body.meta.count).toBe(1);
        expect(response.body.meta.pageCount).toBe(1);
        expect(response.body.meta.totalCount).toBe(1);
        expect(response.body.meta.next).toBeNull();
        expect(response.body.meta.previous).toBeNull();
        expect(response.body.meta.self).toBe("/nft/exchange/bids/canceled?page=1&limit=100&transform=true");
        expect(response.body.meta.first).toBe("/nft/exchange/bids/canceled?page=1&limit=100&transform=true");
        expect(response.body.meta.last).toBe("/nft/exchange/bids/canceled?page=1&limit=100&transform=true");

        // Data
        expect(response.body.data[0].id).toBe("36969b0e9578dc7ce22b4db16bc8d40b2fdb50e4d94b26fbb5f7f0a4e30d2d21");
        expect(response.body.data[0].senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data[0].nftBidCancel.bidId).toStrictEqual(
            "c67beef6edc35f81334e8bf825dbc735e8d579f8297509d74980756b9b9ff8fe",
        );
        expect(response.body.data[0].timestamp.epoch).toStrictEqual(102726536);
        expect(response.body.data[0].timestamp.unix).toStrictEqual(1592827736);
        expect(response.body.data[0].timestamp.human).toStrictEqual("2020-06-22T12:08:56.000Z");
    });

    it('should call \\"getCanceledBidById\\" method', async () => {
        const response = await resource.getCanceledBidById(
            "36969b0e9578dc7ce22b4db16bc8d40b2fdb50e4d94b26fbb5f7f0a4e30d2d21",
        );

        expect(response.status).toBe(200);

        // Data
        expect(response.body.data.id).toBe("36969b0e9578dc7ce22b4db16bc8d40b2fdb50e4d94b26fbb5f7f0a4e30d2d21");
        expect(response.body.data.senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data.nftBidCancel.bidId).toStrictEqual(
            "c67beef6edc35f81334e8bf825dbc735e8d579f8297509d74980756b9b9ff8fe",
        );
        expect(response.body.data.timestamp.epoch).toStrictEqual(102726536);
        expect(response.body.data.timestamp.unix).toStrictEqual(1592827736);
        expect(response.body.data.timestamp.human).toStrictEqual("2020-06-22T12:08:56.000Z");
    });
});
