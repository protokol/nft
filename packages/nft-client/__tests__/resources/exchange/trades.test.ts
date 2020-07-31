import "jest-extended";

import { Trades } from "../../../src/resources/exchange/trades";
import { configureExchangeMocks } from "../../mocks/exchange";

const resource: Trades = configureExchangeMocks<Trades>(Trades);

describe("API - 1.0 - Exchange/Resources - Trades", () => {
    it('should call \\"all\\" method', async () => {
        const response = await resource.all();

        expect(response.status).toBe(200);
    });

    it('should call \\"get\\" method', async () => {
        const response = await resource.get("123");

        expect(response.status).toBe(200);
    });

    it('should call \\"search\\" method', async () => {
        const response = await resource.search({});

        expect(response.status).toBe(200);
    });
});
