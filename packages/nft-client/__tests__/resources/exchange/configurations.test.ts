import "jest-extended";

import { Configurations } from "../../../src/resources/exchange/configurations";
import { configureExchangeMocks } from "../../mocks/exchange";

const resource: Configurations = configureExchangeMocks<Configurations>(Configurations);

describe("API - 1.0 - Exchange/Resources - Configurations", () => {
    it('should call \\"index\\" method', async () => {
        const response = await resource.index();

        expect(response.status).toBe(200);
    });
});
