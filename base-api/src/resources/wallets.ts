import { Contracts } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class WalletsResource implements Contracts.Resource {
    /**
     * Return the raw representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public raw(resource): object {
        return JSON.parse(JSON.stringify(resource));
    }

    /**
     * Return the transformed representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public transform(resource): object {
        return {
            address: resource.address,
            publicKey: resource.publicKey,
            nft: {
                collections: resource.attributes.attributes.nft.base.collections
                    ? resource.attributes.attributes.nft.base.collections
                    : [],
                assetsIds: resource.attributes.attributes.nft.base.tokenIds
                    ? Object.keys(resource.attributes.attributes.nft.base.tokenIds)
                    : [],
            },
        };
    }
}
