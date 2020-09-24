import { Configurations } from "./configurations";
import { Groups } from "./groups";
import { Users } from "./users";

export const GuardianResources = {
    configurations: Configurations,
    users: Users,
    groups: Groups,
};

export type GuardianAvailableResourcesName = keyof typeof GuardianResources;
export type GuardianAvailableResource<T extends GuardianAvailableResourcesName> = InstanceType<
    typeof GuardianResources[T]
>;
