import nock from "nock";

export const mockGuardianUsers = (host: string) => {
    nock(host)
        .get("/guardian/users")
        .reply(200, {
            meta: {
                totalCountIsEstimate: false,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/guardian/users?page=1&limit=100",
                first: "/guardian/users?page=1&limit=100",
                last: "/guardian/users?page=1&limit=100",
            },
            data: [
                {
                    publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    groups: ["group name"],
                    allow: [
                        {
                            transactionType: 1,
                            transactionTypeGroup: 9002,
                        },
                    ],
                    deny: [],
                },
            ],
        });

    nock(host)
        .get("/guardian/users/03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37")
        .reply(200, {
            data: {
                publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                groups: ["group name"],
                allow: [
                    {
                        transactionType: 1,
                        transactionTypeGroup: 9002,
                    },
                ],
                deny: [],
            },
        });

    nock(host)
        .get("/guardian/users/03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37/groups")
        .reply(200, {
            data: [
                {
                    name: "group name",
                    priority: 1,
                    active: false,
                    default: false,
                    allow: [
                        {
                            transactionType: 1,
                            transactionTypeGroup: 9002,
                        },
                    ],
                    deny: [],
                },
            ],
        });
};
