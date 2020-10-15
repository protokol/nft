import { PeerDiscovery } from "./peer-discovery";
import { ProtokolConnection } from "./protokol-connection";

export class ConnectionManager {
    private readonly defaultConnection: ProtokolConnection;
    private readonly protokolConnections: ProtokolConnection[] = [];

    public constructor(defaultConnection: ProtokolConnection) {
        this.defaultConnection = defaultConnection;
    }

    public async findRandomPeers(): Promise<ConnectionManager> {
        const peers = await (await PeerDiscovery.new(this.defaultConnection)).findPeers();
        for (const peer of peers) {
            const coreApi = peer.plugins["@arkecosystem/core-api"];
            if (coreApi) {
                this.protokolConnections.push(new ProtokolConnection(`http://${peer.ip}:${coreApi.port}/api`));
            }
        }
        return Promise.resolve(this);
    }

    public getRandomConnection(): ProtokolConnection {
        return this.protokolConnections[Math.floor(Math.random() * this.protokolConnections.length)];
    }

    public getDefaultConnection(): ProtokolConnection {
        return this.defaultConnection;
    }
}
