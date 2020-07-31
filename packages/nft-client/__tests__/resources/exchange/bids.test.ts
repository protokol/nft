import "jest-extended";

import { Bids } from "../../../src/resources/exchange/bids";
import { configureExchangeMocks } from "../../mocks/exchange";

const resource: Bids = configureExchangeMocks<Bids>(Bids);

describe("API - 1.0 - Exchange/Resources - Bids", () => {
    it('should call \\"getAllBids\\" method', async () => {
        const response = await resource.getAllBids();

        expect(response.status).toBe(200);
    });

    it('should call \\"getBidById\\" method', async () => {
        const response = await resource.getBidById("123");

        expect(response.status).toBe(200);
    });

    it('should call \\"getBidsWallets\\" method', async () => {
        const response = await resource.getBidsWallets("123");

        expect(response.status).toBe(200);
    });

    it('should call \\"searchByBid\\" method', async () => {
        const response = await resource.searchByBid({});

        expect(response.status).toBe(200);
    });

    it('should call \\"getAllCanceledBids\\" method', async () => {
        const response = await resource.getAllCanceledBids();

        expect(response.status).toBe(200);
    });

    it('should call \\"getCanceledBidById\\" method', async () => {
        const response = await resource.getCanceledBidById("123");

        expect(response.status).toBe(200);
    });
});
