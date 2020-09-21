import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Interfaces } from "@protokol/guardian-crypto";

@Container.injectable()
export class GroupSearchService {
    @Container.inject(Container.Identifiers.PaginationService)
    private readonly paginationService!: Services.Search.PaginationService;

    @Container.inject(Container.Identifiers.CacheService)
    @Container.tagged("cache", "@protokol/guardian-transactions")
    private readonly groupsPermissionsCache!: Contracts.Kernel.CacheStore<
        Interfaces.GuardianGroupPermissionsAsset["name"],
        Interfaces.GuardianGroupPermissionsAsset
    >;

    public async getGroup(groupName: string): Promise<Interfaces.GuardianGroupPermissionsAsset | undefined> {
        return this.groupsPermissionsCache.get(groupName);
    }

    public async getGroupsByUserGroups(userGroups: string[]): Promise<Interfaces.GuardianGroupPermissionsAsset[]> {
        const groups: Interfaces.GuardianGroupPermissionsAsset[] = [];
        for (const groupName of userGroups) {
            groups.push((await this.groupsPermissionsCache.get(groupName))!);
        }

        return groups;
    }

    public async getGroupsPage(
        pagination: Contracts.Search.Pagination,
        sorting: Contracts.Search.Sorting,
    ): Promise<Contracts.Search.ResultsPage<Interfaces.GuardianGroupPermissionsAsset>> {
        sorting = [...sorting, { property: "name", direction: "asc" }];

        const groups = await this.groupsPermissionsCache.values();
        return this.paginationService.getPage(pagination, sorting, this.getGroups(groups));
    }

    private *getGroups(
        groups: Interfaces.GuardianGroupPermissionsAsset[],
    ): Iterable<Interfaces.GuardianGroupPermissionsAsset> {
        for (const group of groups) {
            yield group;
        }
    }
}
