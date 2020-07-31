import nock from "nock";

export const mockExchangeConfigurations = (host: string) => {
    nock(host).get("/nft/exchange/configurations").reply(200, {});
};
