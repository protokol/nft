import "jest-extended";

import { Groups } from "../../../src/resources/guardian/groups";
import { configureGuardianMocks } from "../../mocks/guardian";

const resource: Groups = configureGuardianMocks<Groups>(Groups);

describe("API - 1.0 - Guardian/Resources - Groups", () => {
    it('should call \\"index\\" method', async () => {
        const response = await resource.index();

        expect(response.status).toBe(200);

        // Pagination
        // expect(response.body.meta.totalCountIsEstimate).toBeTruthy(); // add to arkecosystem client
        expect(response.body.meta.count).toBe(1);
        expect(response.body.meta.pageCount).toBe(1);
        expect(response.body.meta.totalCount).toBe(1);
        expect(response.body.meta.next).toBeNull();
        expect(response.body.meta.previous).toBeNull();
        expect(response.body.meta.self).toBe("/guardian/groups?page=1&limit=100");
        expect(response.body.meta.first).toBe("/guardian/groups?page=1&limit=100");
        expect(response.body.meta.last).toBe("/guardian/groups?page=1&limit=100");

        // Data
        expect(response.body.data).toBeArray();
        expect(response.body.data[0].name).toStrictEqual("group name");
        expect(response.body.data[0].priority).toStrictEqual(1);
        expect(response.body.data[0].active).toStrictEqual(false);
        expect(response.body.data[0].default).toStrictEqual(false);
        expect(response.body.data[0].allow).toStrictEqual([
            {
                transactionType: 1,
                transactionTypeGroup: 9002,
            },
        ]);
        expect(response.body.data[0].deny).toBeArrayOfSize(0);
    });

    it('should call \\"get\\" method', async () => {
        const response = await resource.get("group%20name");

        // Data
        expect(response.body.data.name).toStrictEqual("group name");
        expect(response.body.data.priority).toStrictEqual(1);
        expect(response.body.data.active).toStrictEqual(false);
        expect(response.body.data.default).toStrictEqual(false);
        expect(response.body.data.allow).toStrictEqual([
            {
                transactionType: 1,
                transactionTypeGroup: 9002,
            },
        ]);
        expect(response.body.data.deny).toBeArrayOfSize(0);
    });

    it('should call \\"users\\" method', async () => {
        const response = await resource.users("group%20name");

        // Data
        expect(response.body.data).toBeArray();
        expect(response.body.data[0].publicKey).toStrictEqual(
            "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        );
        expect(response.body.data[0].groups).toStrictEqual(["group name"]);
        expect(response.body.data[0].allow).toStrictEqual([
            {
                transactionType: 1,
                transactionTypeGroup: 9002,
            },
        ]);
        expect(response.body.data[0].deny).toBeArrayOfSize(0);
    });
});
