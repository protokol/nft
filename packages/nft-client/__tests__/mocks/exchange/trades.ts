import nock from "nock";

export const mockTrades = (host: string) => {
    nock(host).get("/nft/exchange/trades").reply(200, {});

    nock(host).get("/nft/exchange/trades/123").reply(200, {});

    nock(host).post("/nft/exchange/trades/search").reply(200, {});
};
