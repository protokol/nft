import nock from "nock";

export const mockAssets = (host: string) => {
    nock(host).get("/nft/assets").reply(200, {});

    nock(host).get("/nft/assets/123").reply(200, {});

    nock(host).get("/nft/assets/123/wallets").reply(200, {});

    nock(host).post("/nft/assets/search").reply(200, {});
};
