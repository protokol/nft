import { NFTConnection } from "./nft-connection";

const main = async () => {
    const a = new NFTConnection("http://localhost:4003/api/nft");
    console.log((await a.NFTBaseApi("transfers").all()).body.data);
};
main();
