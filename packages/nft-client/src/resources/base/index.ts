import { Assets } from "./assets";
import { Burns } from "./burns";
import { Configurations } from "./configurations";
import { Transfers } from "./transfers";
import { Collections } from "./collections";

export const NFTBaseResources = {
    assets: Assets,
    burns: Burns,
    configurations: Configurations,
    transfers: Transfers,
    collections: Collections
};

export type NFTBaseAvailableResourcesName = keyof typeof NFTBaseResources;
export type NFTBaseAvailableResource<T extends NFTBaseAvailableResourcesName> = InstanceType<
    typeof NFTBaseResources[T]
>;
