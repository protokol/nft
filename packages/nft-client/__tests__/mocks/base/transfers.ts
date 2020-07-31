import nock from "nock";

export const mockTransfers = (host: string) => {
    nock(host).get("/nft/transfers").reply(200, {});

    nock(host).get("/nft/transfers/123").reply(200, {});
};
