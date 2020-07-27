import { NFTConnection } from "./nft-connection";

export * from "./nft-connection";
export * as BaseResources from "./resources/base";
export * as ExchangeResources from "./resources/exchange";
export * as BaseResourcesTypes from "./resourcesTypes/base";
export * as ExchangeResourcesTypes from "./resourcesTypes/exchange";

const main = async () => {
    const connection = new NFTConnection("http://localhost:4003/api");
    const response = connection.NFTBaseApi("collections").searchByCollections({jsonSchema: {properties: {name: {type: "string"}}}});
    console.log((await response).body.data);
};
main();
