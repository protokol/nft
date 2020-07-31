import nock from "nock";

export const mockBurns = (host: string) => {
    nock(host).get("/nft/burns").reply(200, {});

    nock(host).get("/nft/burns/123").reply(200, {});
};
