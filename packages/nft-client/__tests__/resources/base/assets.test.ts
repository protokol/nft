import "jest-extended";

import { Assets } from "../../../src/resources/base/assets";
import { configureBaseMocks } from "../../mocks/base";

const resource: Assets = configureBaseMocks<Assets>(Assets);

describe("API - 1.0 - Base/Resources - Assets", () => {
    it('should call \\"all\\" method', async () => {
        const response = await resource.all();

        expect(response.status).toBe(200);
    });

    it('should call \\"get\\" method', async () => {
        const response = await resource.get("123");

        expect(response.status).toBe(200);
    });

    it('should call \\"wallet\\" method', async () => {
        const response = await resource.wallet("123");

        expect(response.status).toBe(200);
    });

    it('should call \\"searchByAsset\\" method', async () => {
        const response = await resource.searchByAsset({});

        expect(response.status).toBe(200);
    });
});
