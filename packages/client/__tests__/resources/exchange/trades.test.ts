import "jest-extended";

import { Trades } from "../../../src/resources/nft/exchange/trades";
import { configureExchangeMocks } from "../../mocks/exchange";

const resource: Trades = configureExchangeMocks<Trades>(Trades);

describe("API - 1.0 - Exchange/Resources - Trades", () => {
    it('should call \\"all\\" method', async () => {
        const response = await resource.all();

        expect(response.status).toBe(200);

        // Pagination
        // expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
        expect(response.body.meta.count).toBe(1);
        expect(response.body.meta.pageCount).toBe(1);
        expect(response.body.meta.totalCount).toBe(1);
        expect(response.body.meta.next).toBeNull();
        expect(response.body.meta.previous).toBeNull();
        expect(response.body.meta.self).toBe("/nft/exchange/trades?page=1&limit=100&transform=true");
        expect(response.body.meta.first).toBe("/nft/exchange/trades?page=1&limit=100&transform=true");
        expect(response.body.meta.last).toBe("/nft/exchange/trades?page=1&limit=100&transform=true");

        // Data
        expect(response.body.data[0].id).toBe("6a63192e55a62d4dc98ac335054dc928e62bad3a46948446e32f1d7e56b11fd3");
        expect(response.body.data[0].senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data[0].completedTrade.auctionId).toStrictEqual(
            "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
        );
        expect(response.body.data[0].completedTrade.bidId).toStrictEqual(
            "032383b3f5c541c117c3409fdb1545e7b34deb0f6922ef7a42c40867d24402d8",
        );
        expect(response.body.data[0].timestamp.epoch).toStrictEqual(102726736);
        expect(response.body.data[0].timestamp.unix).toStrictEqual(1592827936);
        expect(response.body.data[0].timestamp.human).toStrictEqual("2020-06-22T12:12:16.000Z");
    });

    it('should call \\"get\\" method', async () => {
        const response = await resource.get("6a63192e55a62d4dc98ac335054dc928e62bad3a46948446e32f1d7e56b11fd3");

        expect(response.status).toBe(200);

        // Data
        expect(response.body.data.id).toBe("6a63192e55a62d4dc98ac335054dc928e62bad3a46948446e32f1d7e56b11fd3");
        expect(response.body.data.senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data.completedTrade.auction.id).toStrictEqual(
            "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
        );
        expect(response.body.data.completedTrade.auction.nftIds).toStrictEqual([
            "a8016c66d160606e289ed8bab6ce2b2d9916197111e8612257b10e54d83ba827",
        ]);
        expect(response.body.data.completedTrade.auction.startAmount).toStrictEqual("999");
        expect(response.body.data.completedTrade.auction.expiration.blockHeight).toStrictEqual(1000000);
        expect(response.body.data.completedTrade.bid.id).toStrictEqual(
            "032383b3f5c541c117c3409fdb1545e7b34deb0f6922ef7a42c40867d24402d8",
        );
        expect(response.body.data.completedTrade.bid.auctionId).toStrictEqual(
            "d8177d5c2a3eee46aea48fa5a8ce7c58c43c71909ac6cf9568e11065dc1f544a",
        );
        expect(response.body.data.completedTrade.bid.bidAmount).toStrictEqual("1223");
        expect(response.body.data.timestamp.epoch).toStrictEqual(102726736);
        expect(response.body.data.timestamp.unix).toStrictEqual(1592827936);
        expect(response.body.data.timestamp.human).toStrictEqual("2020-06-22T12:12:16.000Z");
    });

    it('should call \\"search\\" method', async () => {
        const response = await resource.search({
            bidId: "405d07d0b41c7a279cab832c267d3be0e5947bdf89156103865e8a290d4e907a",
        });

        expect(response.status).toBe(200);

        // Pagination
        // expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
        expect(response.body.meta.count).toBe(1);
        expect(response.body.meta.pageCount).toBe(1);
        expect(response.body.meta.totalCount).toBe(1);
        expect(response.body.meta.next).toBeNull();
        expect(response.body.meta.previous).toBeNull();
        expect(response.body.meta.self).toBe("/nft/exchange/trades/search?page=1&limit=100&transform=true");
        expect(response.body.meta.first).toBe("/nft/exchange/trades/search?page=1&limit=100&transform=true");
        expect(response.body.meta.last).toBe("/nft/exchange/trades/search?page=1&limit=100&transform=true");

        // Data
        expect(response.body.data[0].id).toBe("b55750470dfb3e98a8a7acd4d1e933ab20db1ddd18343b7f6ddaa2a4395a9d06");
        expect(response.body.data[0].senderPublicKey).toBe(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data[0].completedTrade.auctionId).toStrictEqual(
            "4acf50de691a6173a07ccb769381003685ebbdb2dbc9d7601baa882cc9bbfd56",
        );
        expect(response.body.data[0].completedTrade.bidId).toStrictEqual(
            "405d07d0b41c7a279cab832c267d3be0e5947bdf89156103865e8a290d4e907a",
        );
        expect(response.body.data[0].timestamp.epoch).toStrictEqual(105743104);
        expect(response.body.data[0].timestamp.unix).toStrictEqual(1595844304);
        expect(response.body.data[0].timestamp.human).toStrictEqual("2020-07-27T10:05:04.000Z");
    });
});
