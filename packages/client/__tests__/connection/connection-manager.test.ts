import "jest-extended";

const nock = require("nock");

import { ConnectionManager } from "../../src";
import { ProtokolConnection } from "../../src";
import { dummyPeers } from "../mocks/peer-discovery/peers";

const url = "http://127.0.0.1/api";

beforeEach(() => {
    nock.cleanAll();
});

describe("ConnectionManager tests", () => {
    beforeEach(async () => {
        nock(/.+/)
            .get("/api/peers")
            .reply(200, {
                data: dummyPeers,
            })
            .persist();
    });

    it("should get defaultNFTConnection from ConnectionManager", () => {
        const conn = new ProtokolConnection(url);
        const connManager = new ConnectionManager(conn);

        const defaultConn = connManager.getDefaultConnection();

        expect(defaultConn).toBe(conn);
    });

    it("should get randomNFTConnection from ConnectionManager", async () => {
        const conn = new ProtokolConnection(url);
        const connManager = new ConnectionManager(conn);
        await connManager.findRandomPeers();

        const randomConn = connManager.getRandomConnection();

        expect(dummyPeers.map((x) => new ProtokolConnection(`http://${x.ip}:4003/api`))).toContainEqual(randomConn);
    });

});
