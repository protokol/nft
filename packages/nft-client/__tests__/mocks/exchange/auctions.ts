import nock from "nock";

export const mockAuctions = (host: string) => {
    nock(host).get("/nft/exchange/auctions").reply(200, {});

    nock(host).get("/nft/exchange/auctions/123").reply(200, {});

    nock(host).get("/nft/exchange/auctions/123/wallets").reply(200, {});

    nock(host).post("/nft/exchange/auctions/search").reply(200, {});

    nock(host).get("/nft/exchange/auctions/canceled").reply(200, {});

    nock(host).get("/nft/exchange/auctions/canceled/123").reply(200, {});
};
