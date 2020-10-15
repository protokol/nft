import { mockAuctions } from "./auctions";
import { mockBids } from "./bids";
import { mockExchangeConfigurations } from "./configurations";
import { mockTrades } from "./trades";
import { ProtokolConnection } from "../../../../src";

export const configureExchangeMocks = <T>(resource): T => {
    const host = "https://example.net:4003/api";

    mockAuctions(host);
    mockBids(host);
    mockExchangeConfigurations(host);
    mockTrades(host);

    return new resource(new ProtokolConnection(host));
};
