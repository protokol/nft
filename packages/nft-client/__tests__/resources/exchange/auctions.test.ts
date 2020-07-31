import "jest-extended";

import { Auctions } from "../../../src/resources/exchange/auctions";
import { configureExchangeMocks } from "../../mocks/exchange";

const resource: Auctions = configureExchangeMocks<Auctions>(Auctions);

describe("API - 1.0 - Exchange/Resources - Auctions", () => {
    it('should call \\"getAllAuctions\\" method', async () => {
        const response = await resource.getAllAuctions();

        expect(response.status).toBe(200);
    });

    it('should call \\"getAuctionById\\" method', async () => {
        const response = await resource.getAuctionById("123");

        expect(response.status).toBe(200);
    });

    it('should call \\"getAuctionsWallets\\" method', async () => {
        const response = await resource.getAuctionsWallets("123");

        expect(response.status).toBe(200);
    });

    it('should call \\"searchByAsset\\" method', async () => {
        const response = await resource.searchByAsset({});

        expect(response.status).toBe(200);
    });

    it('should call \\"getAllCanceledAuctions\\" method', async () => {
        const response = await resource.getAllCanceledAuctions();

        expect(response.status).toBe(200);
    });

    it('should call \\"getCanceledAuctionById\\" method', async () => {
        const response = await resource.getCanceledAuctionById("123");

        expect(response.status).toBe(200);
    });
});
