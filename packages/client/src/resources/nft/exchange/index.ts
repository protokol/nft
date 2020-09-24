import { Auctions } from "./auctions";
import { Bids } from "./bids";
import { Configurations } from "./configurations";
import { Trades } from "./trades";

export const NFTExchangeResources = {
	configurations: Configurations,
	auctions: Auctions,
	bids: Bids,
	trades: Trades,
};

export type NFTExchangeAvailableResourcesName = keyof typeof NFTExchangeResources;
export type NFTExchangeAvailableResource<T extends NFTExchangeAvailableResourcesName> = InstanceType<
	typeof NFTExchangeResources[T]
>;
