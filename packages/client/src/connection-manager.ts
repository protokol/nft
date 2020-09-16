import { GuardianConnection } from "./guardian-connection";
import { NFTConnection } from "./nft-connection";
import { PeerDiscovery } from "./peer-discovery";

export class ConnectionManager {
    private readonly defaultConnection: NFTConnection | GuardianConnection;
    private readonly nftConnections: NFTConnection[] = [];
    private readonly guardianConnections: GuardianConnection[] = [];
    public constructor(defaultNftConnection: NFTConnection | GuardianConnection) {
        this.defaultConnection = defaultNftConnection;
    }

    public async findRandomPeers(): Promise<ConnectionManager> {
        const peers = await (await PeerDiscovery.new(this.defaultConnection)).findPeers();
        for (const peer of peers) {
            const coreApi = peer.ports["@arkecosystem/core-api"];
            if (coreApi) {
                if (typeof this.defaultConnection === typeof NFTConnection) {
                    this.nftConnections.push(new NFTConnection(`http://${peer.ip}:${coreApi}/api`));
                } else if (typeof this.defaultConnection === typeof GuardianConnection) {
                    this.guardianConnections.push(new GuardianConnection(`http://${peer.ip}:${coreApi}/api`));
                }
            }
        }
        return Promise.resolve(this);
    }

    public getRandomNFTConnection(): NFTConnection {
        if (typeof this.defaultConnection !== typeof NFTConnection) {
            throw new Error("Can't return random NFTConnection");
        }
        return this.nftConnections[Math.floor(Math.random() * this.nftConnections.length)];
    }

    public getDefaultNFTConnection(): NFTConnection {
        if (typeof this.defaultConnection !== typeof NFTConnection) {
            throw new Error("Can't return NFTConnection");
        }
        return this.defaultConnection as NFTConnection;
    }

    public getRandomGuardianConnection(): GuardianConnection {
        if (typeof this.defaultConnection !== typeof GuardianConnection) {
            throw new Error("Can't return random GuardianConnection");
        }
        return this.guardianConnections[Math.floor(Math.random() * this.guardianConnections.length)];
    }

    public getDefaultGuardianConnection(): GuardianConnection {
        if (typeof this.defaultConnection !== typeof GuardianConnection) {
            throw new Error("Can't return GuardianConnection");
        }
        return this.defaultConnection as GuardianConnection;
    }
}
