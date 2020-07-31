import nock from "nock";

export const mockBids = (host: string) => {
    nock(host).get("/nft/exchange/bids").reply(200, {});

    nock(host).get("/nft/exchange/bids/123").reply(200, {});

    nock(host).get("/nft/exchange/bids/123/wallets").reply(200, {});

    nock(host).post("/nft/exchange/bids/search").reply(200, {});

    nock(host).get("/nft/exchange/bids/canceled").reply(200, {});

    nock(host).get("/nft/exchange/bids/canceled/123").reply(200, {});
};
