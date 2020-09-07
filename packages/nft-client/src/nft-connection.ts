import { Connection } from "@arkecosystem/client";

import { PeerDiscovery } from "./peerDiscovery";
import { NFTBaseAvailableResource, NFTBaseAvailableResourcesName, NFTBaseResources } from "./resources/base";
import {
    NFTExchangeAvailableResource,
    NFTExchangeAvailableResourcesName,
    NFTExchangeResources,
} from "./resources/exchange";

export class NFTConnection extends Connection {
    private readonly startingHost: string;
    // @ts-ignore
    public constructor(host: string, private readonly randomize: boolean = false) {
        super(host);
        this.startingHost = host;
    }

    public async NFTBaseApi<T extends NFTBaseAvailableResourcesName>(name: T) {
        const selectedResourceClass = NFTBaseResources[name.toLowerCase() as NFTBaseAvailableResourcesName];
        return new selectedResourceClass(this) as NFTBaseAvailableResource<T>;
    }

    public async NFTExchangeApi<T extends NFTExchangeAvailableResourcesName>(name: T) {
        const selectedResourceClass = NFTExchangeResources[name.toLowerCase() as NFTExchangeAvailableResourcesName];
        return new selectedResourceClass(this) as NFTExchangeAvailableResource<T>;
    }

    public async peerDiscovery(networkOrUrl?: "mainnet" | "devnet" | string) {
        return await PeerDiscovery.new(this, networkOrUrl);
    }

    // @ts-ignore
    private async findRandomPeer(): string {
        const peers = await (await this.peerDiscovery(this.startingHost)).findPeers();
        const selectedPeer = peers[Math.floor(Math.random() * peers.length)];
        return `${selectedPeer.ip}:${selectedPeer.ports["@arkecosystem/core-api"]}`;
    }
}
