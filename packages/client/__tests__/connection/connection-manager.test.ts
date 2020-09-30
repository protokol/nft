import "jest-extended";

import { Connection } from "@arkecosystem/client";
import nock from "nock";

import { ConnectionManager, GuardianConnection, NFTConnection } from "../../src";
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
                data: [{ ports: {} }, ...dummyPeers],
            })
            .persist();
    });

    it("should get defaultNFTConnection from ConnectionManager", () => {
        const conn = new NFTConnection(url);
        const connManager = new ConnectionManager(conn);

        const defaultConn = connManager.getDefaultNFTConnection();

        expect(defaultConn).toBe(conn);
    });

    it("should throw if trying to get defaultNFTConnection from ConnectionManager that was initialized with other connection", () => {
        const conn = new GuardianConnection(url);
        const connManager = new ConnectionManager(conn);

        expect(() => connManager.getDefaultNFTConnection()).toThrowError(new Error("Can't return NFTConnection"));
    });

    it("should get randomNFTConnection from ConnectionManager", async () => {
        const conn = new NFTConnection(url);
        const connManager = new ConnectionManager(conn);
        await connManager.findRandomPeers();

        const randomConn = connManager.getRandomNFTConnection();

        expect(dummyPeers.map((x) => new NFTConnection(`http://${x.ip}:4003/api`))).toContainEqual(randomConn);
    });

    it("should throw if trying to get randomNFTConnection from ConnectionManager that was initialized with other connection", () => {
        const conn = new GuardianConnection(url);
        const connManager = new ConnectionManager(conn);

        expect(() => connManager.getRandomNFTConnection()).toThrowError(new Error("Can't return random NFTConnection"));
    });

    it("should get defaultGuardianConnection from ConnectionManager", () => {
        const conn = new GuardianConnection(url);
        const connManager = new ConnectionManager(conn);

        const defaultConn = connManager.getDefaultGuardianConnection();

        expect(defaultConn).toBe(conn);
    });

    it("should throw if trying to get defaultGuardianConnection from ConnectionManager that was initialized with other connection", () => {
        const conn = new NFTConnection(url);
        const connManager = new ConnectionManager(conn);

        expect(() => connManager.getDefaultGuardianConnection()).toThrowError(
            new Error("Can't return GuardianConnection"),
        );
    });

    it("should get randomGuardianConnection from ConnectionManager", async () => {
        const conn = new GuardianConnection(url);
        const connManager = new ConnectionManager(conn);
        await connManager.findRandomPeers();

        const randomConn = connManager.getRandomGuardianConnection();

        expect(dummyPeers.map((x) => new NFTConnection(`http://${x.ip}:4003/api`))).toContainEqual(randomConn);
    });

    it("should throw if trying to get randomGuardianConnection from ConnectionManager that was initialized with other connection", () => {
        const conn = new NFTConnection(url);
        const connManager = new ConnectionManager(conn);

        expect(() => connManager.getRandomGuardianConnection()).toThrowError(
            new Error("Can't return random GuardianConnection"),
        );
    });

    it("should throw if connection is not one of NFTConnection or GuardianConnection", async () => {
        const conn = new Connection(url);
        const connManager = new ConnectionManager(conn as NFTConnection);
        await connManager.findRandomPeers();

        expect(() => connManager.getDefaultNFTConnection()).toThrowError(new Error("Can't return NFTConnection"));
    });
});
