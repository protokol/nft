import { Configurations } from "./configurations";
import { Auctions } from "./auctions";

export const NFTExchangeResources = {
    configurations: Configurations,
    auctions: Auctions,
};

export type NFTExchangeAvailableResourcesName = keyof typeof NFTExchangeResources;
export type NFTExchangeAvailableResource<T extends NFTExchangeAvailableResourcesName> = InstanceType<
    typeof NFTExchangeResources[T]
>;
