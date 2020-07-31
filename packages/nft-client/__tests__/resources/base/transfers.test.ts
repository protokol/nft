import "jest-extended";

import { Transfers } from "../../../src/resources/base/transfers";
import { configureBaseMocks } from "../../mocks/base";

const resource: Transfers = configureBaseMocks<Transfers>(Transfers);

describe("API - 1.0 - Base/Resources - Transfers", () => {
    it('should call \\"all\\" method', async () => {
        const response = await resource.all();

        expect(response.status).toBe(200);
    });

    it('should call \\"get\\" method', async () => {
        const response = await resource.get("123");

        expect(response.status).toBe(200);
    });
});
