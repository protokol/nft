// @ts-ignore
import { GuardianConnection } from "./guardian-connection";
import { NFTConnection } from "./nft-connection";
import { ConnectionManager } from "./connection-manager";

export * from "./nft-connection";
export * as BaseResources from "./resources/nft/base";
export * as ExchangeResources from "./resources/nft/exchange";
export * as BaseResourcesTypes from "./resources-types/nft/base";
export * as ExchangeResourcesTypes from "./resources-types/nft/exchange";
export { Timestamp } from "./resources-types/timestamp";
export { PeerDiscovery } from "./peer-discovery";
export { ConnectionManager } from "./connection-manager";

const main = async () => {
    // const guardianConnection = new GuardianConnection("http://localhost:4003/api");
    // const response = await guardianConnection.guardianApi("users").userGroups("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");
    // console.log(response.body);

    const defaultConnection = new NFTConnection("http://135.181.83.62:4003/api");
    const nftConnectionManager = new ConnectionManager<NFTConnection>(defaultConnection);

    const randomConnection = (await nftConnectionManager.findRandomPeers()).getRandomConnection();
    const all = randomConnection.NFTBaseApi("assets").all();
    console.log(await all);

};

main();
