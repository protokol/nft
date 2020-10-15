import { mockAssets } from "./assets";
import { mockBurns } from "./burns";
import { mockCollections } from "./collections";
import { mockBaseConfigurations } from "./configurations";
import { mockTransfers } from "./transfers";
import { ProtokolConnection } from "../../../../src";

export const configureBaseMocks = <T>(resource): T => {
    const host = "https://example.net:4003/api";

    mockAssets(host);
    mockBurns(host);
    mockBaseConfigurations(host);
    mockCollections(host);
    mockTransfers(host);

    return new resource(new ProtokolConnection(host));
};
