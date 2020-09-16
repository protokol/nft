import { Assets } from "./assets";
import { Burns } from "./burns";
import { Collections } from "./collections";
import { Configurations } from "./configurations";
import { Transfers } from "./transfers";

export const NFTBaseResources = {
    assets: Assets,
    burns: Burns,
    configurations: Configurations,
    transfers: Transfers,
    collections: Collections,
};

export type NFTBaseAvailableResourcesName = keyof typeof NFTBaseResources;
export type NFTBaseAvailableResource<T extends NFTBaseAvailableResourcesName> = InstanceType<
    typeof NFTBaseResources[T]
>;
