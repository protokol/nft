import "jest-extended";

import { Burns } from "../../../src/resources/base/burns";
import { configureBaseMocks } from "../../mocks/base";

const resource: Burns = configureBaseMocks<Burns>(Burns);

describe("API - 1.0 - Base/Resources - Burns", () => {
    it('should call \\"all\\" method', async () => {
        const response = await resource.all();

        expect(response.status).toBe(200);
    });

    it('should call \\"get\\" method', async () => {
        const response = await resource.get("123");

        expect(response.status).toBe(200);
    });
});
