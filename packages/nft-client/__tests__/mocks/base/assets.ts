import nock from "nock";

export const mockAssets = (host: string) => {
    nock(host)
        .get("/nft/assets")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/assets?page=1&limit=100&transform=true",
                first: "/nft/assets?page=1&limit=100&transform=true",
                last: "/nft/assets?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe",
                    ownerPublicKey: "0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
                    senderPublicKey: "0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
                    collectionId: "73e00a64a47c758d8d227163a24901b05c86e0e7b466c02596ad6eeff92d3147",
                    attributes: {
                        name: "name",
                        pac: 1,
                        sho: 2,
                        pas: 3,
                    },
                    timestamp: {
                        epoch: 108972496,
                        unix: 1599073696,
                        human: "2020-09-02T19:08:16.000Z",
                    },
                },
            ],
        });

    nock(host)
        .get("/nft/assets/ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe")
        .reply(200, {
            data: {
                id: "ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe",
                ownerPublicKey: "0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
                senderPublicKey: "0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
                collectionId: "73e00a64a47c758d8d227163a24901b05c86e0e7b466c02596ad6eeff92d3147",
                attributes: {
                    name: "name",
                    pac: 1,
                    sho: 2,
                    pas: 3,
                },
                timestamp: {
                    epoch: 108972496,
                    unix: 1599073696,
                    human: "2020-09-02T19:08:16.000Z",
                },
            },
        });

    nock(host)
        .get("/nft/assets/ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe/wallets")
        .reply(200, {
            data: {
                address: "AcmXmomxpP8NahbbFivq32QmLuKFkTkqRg",
                publicKey: "0311077c86a98b67850e7ed2c81775d094cf81c6991082ddc33fc7be5347dc765d",
                nft: {
                    collections: [
                        {
                            collectionId: "6ff2ff08f14d601a09c5fffee17f151899308885b9503861cb62a79acbd3332d",
                            currentSupply: 0,
                            nftCollectionAsset: {
                                name: "MHERO-CARDS",
                                description: "testing if matej kicked ass",
                                maximumSupply: 5,
                                jsonSchema: {
                                    name: {
                                        type: "string",
                                    },
                                    pac: {
                                        type: "number",
                                    },
                                    sho: {
                                        type: "number",
                                    },
                                    pas: {
                                        type: "number",
                                    },
                                },
                            },
                        },
                    ],
                    assetsIds: ["ca1fa8e79f60c1237c42f7ae5d6470d06ec7aa81b4dffd8d165e01c52e0782fe"],
                },
            },
        });

    nock(host)
        .post("/nft/assets/search")
        .reply(200, {
            meta: {
                totalCountIsEstimate: true,
                count: 1,
                pageCount: 1,
                totalCount: 1,
                next: null,
                previous: null,
                self: "/nft/assets/search?page=1&limit=100&transform=true",
                first: "/nft/assets/search?page=1&limit=100&transform=true",
                last: "/nft/assets/search?page=1&limit=100&transform=true",
            },
            data: [
                {
                    id: "1eeef6bac21a47cc33f897ee1f4e3eb2357108e859c614acd1a99e0a1cc5a117",
                    ownerPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                    collectionId: "6c456c5687b1ca1b9a89457bc26dc8a7223694084a8f89cf295fc688f5a3342b",
                    attributes: {
                        name: "Antonio Caracciolo",
                        pac: 90,
                        sho: 65,
                        pas: 23,
                        dri: 32,
                        def: 21,
                        phy: 12,
                    },
                    timestamp: {
                        epoch: 105740128,
                        unix: 1595841328,
                        human: "2020-07-27T09:15:28.000Z",
                    },
                },
            ],
        });
};
