import { NFTConnection } from "./nft-connection";

const main = async () => {
    const a = new NFTConnection("http://localhost:4003/api/nft");
    console.log((await a.NFTExchangeApi("auctions").getAuctionsWallets("b9e196025747bb64672762ce6eb26bf75bdb23dc23fa85e583dec35cd10b24b7")).body.data);
};
main();
