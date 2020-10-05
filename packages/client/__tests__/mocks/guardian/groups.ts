import nock from "nock";

export const mockGuardianGroups = (host: string) => {
    nock(host)
        .get("/guardian/groups")
        .reply(200, {
            meta: {
                totalCountIsEstimate: false,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/guardian/groups?page=1&limit=100",
                first: "/guardian/groups?page=1&limit=100",
                last: "/guardian/groups?page=1&limit=100",
            },
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

    nock(host)
        .get("/guardian/groups/group%20name")
        .reply(200, {
            data: {
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
        });

    nock(host)
        .get("/guardian/groups/group%20name/users")
        .reply(200, {
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
};
