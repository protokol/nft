import { NFTConnection } from "./nft-connection";

const main = async () => {
    const a = new NFTConnection("http://nft.protokol.com:4003/api/nft");
    console.log(
        (
            await a.NFTBaseApi("assets").searchByAsset({
                name: "Antonio Caracciolo",
            })
        ).body.data,
    );
};
main();
