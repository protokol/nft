import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Interfaces } from "@protokol/guardian-transactions";

@Container.injectable()
export class GroupSearchService {
	@Container.inject(Container.Identifiers.PaginationService)
	private readonly paginationService!: Services.Search.PaginationService;

	@Container.inject(Container.Identifiers.CacheService)
	@Container.tagged("cache", "@protokol/guardian-transactions")
	private readonly groupsPermissionsCache!: Contracts.Kernel.CacheStore<
		Interfaces.IGroupPermissions["name"],
		Interfaces.IGroupPermissions
	>;

	public async getGroup(groupName: string): Promise<Interfaces.IGroupPermissions | undefined> {
		return this.groupsPermissionsCache.get(groupName);
	}

	public async getGroupsByUserGroups(userGroups: string[]): Promise<Interfaces.IGroupPermissions[]> {
		const groups: Interfaces.IGroupPermissions[] = [];
		for (const groupName of userGroups) {
			groups.push((await this.groupsPermissionsCache.get(groupName))!);
		}

		return groups;
	}

	public async getGroupsPage(
		pagination: Contracts.Search.Pagination,
		sorting: Contracts.Search.Sorting,
	): Promise<Contracts.Search.ResultsPage<Interfaces.IGroupPermissions>> {
		sorting = [...sorting, { property: "name", direction: "asc" }];

		const groups = await this.groupsPermissionsCache.values();
		return this.paginationService.getPage(pagination, sorting, this.getGroups(groups));
	}

	private *getGroups(groups: Interfaces.IGroupPermissions[]): Iterable<Interfaces.IGroupPermissions> {
		for (const group of groups) {
			yield group;
		}
	}
}
