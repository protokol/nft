import { NFTConnection } from "../../../src";
import { mockBaseConfigurations } from "./configurations";
import { mockCollections } from "./collections";

export const configureMocks = <T>(resource): T => {
    const host = "https://example.net:4003/api";

    mockBaseConfigurations(host);
    mockCollections(host);

    return new resource(new NFTConnection(host));
};
