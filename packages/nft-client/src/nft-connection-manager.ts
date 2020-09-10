import { NFTConnection } from "./nft-connection";
import { PeerDiscovery } from "./peerDiscovery";

export class NFTConnectionManager {
    private readonly defaultNftConnection: NFTConnection;
    private readonly nftConnections: NFTConnection[] = [];
    public constructor(defaultNftConnection: NFTConnection) {
        this.defaultNftConnection = defaultNftConnection;
    }

    public async findRandomPeers(): Promise<NFTConnectionManager> {
        const peers = await (await PeerDiscovery.new(this.defaultNftConnection)).findPeers();
        for (const peer of peers) {
            const coreApi = peer.ports["@arkecosystem/core-api"];
            if (coreApi) {
                this.nftConnections.push(new NFTConnection(`http://${peer.ip}:${coreApi}/api`));
            }
        }
        return Promise.resolve(this);
    }

    public getRandomConnection(): NFTConnection {
        return this.nftConnections[Math.floor(Math.random() * this.nftConnections.length)];
    }

    public getDefaultNftConnection(): NFTConnection {
        return this.defaultNftConnection;
    }
}
