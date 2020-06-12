import { Assets } from "./assets";
import { Burns } from "./burns";
import { Configurations } from "./configurations";

export const NFTBaseResources = {
    assets: Assets,
    burns: Burns,
    configuration: Configurations,
};

export type NFTBaseAvailableResourcesName = keyof typeof NFTBaseResources;
export type NFTBaseAvailableResource<T extends NFTBaseAvailableResourcesName> = InstanceType<
    typeof NFTBaseResources[T]
>;
