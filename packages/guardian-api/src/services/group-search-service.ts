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

	@Container.inject(Container.Identifiers.StandardCriteriaService)
	private readonly standardCriteriaService!: Services.Search.StandardCriteriaService;

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
		criteria,
	): Promise<Contracts.Search.ResultsPage<Interfaces.IGroupPermissions>> {
		sorting = [...sorting, { property: "name", direction: "asc" }];
		// add support for case insensitive criteria
		if (criteria.name) {
			criteria.name = criteria.name.toLocaleLowerCase();
		}

		const groups = await this.groupsPermissionsCache.values();
		return this.paginationService.getPage(pagination, sorting, this.getGroups(groups, criteria));
	}

	private *getGroups(groups: Interfaces.IGroupPermissions[], criteria): Iterable<Interfaces.IGroupPermissions> {
		for (const group of groups) {
			if (
				this.standardCriteriaService.testStandardCriterias(
					{ ...group, name: group.name.toLocaleLowerCase() },
					criteria,
				)
			) {
				yield group;
			}
		}
	}
}
