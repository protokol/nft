import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Indexers, Interfaces } from "@protokol/guardian-transactions";

import { UserCriteria, UserResource } from "../resources";

@Container.injectable()
export class UserSearchService {
	@Container.inject(Container.Identifiers.PaginationService)
	private readonly paginationService!: Services.Search.PaginationService;

	@Container.inject(Container.Identifiers.WalletRepository)
	@Container.tagged("state", "blockchain")
	private readonly walletRepository!: Contracts.State.WalletRepository;

	@Container.inject(Container.Identifiers.StandardCriteriaService)
	private readonly standardCriteriaService!: Services.Search.StandardCriteriaService;

	public getUser(id: string): UserResource | undefined {
		const wallet = this.walletRepository.getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer).get(id);
		if (!wallet) return;

		return this.getUserResourceFromWallet(wallet);
	}

	public getUsersByGroup(groupName: string): UserResource[] {
		return this.walletRepository
			.getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer)
			.values()
			.filter((user) => user.getAttribute("guardian.userPermissions").groups.includes(groupName))
			.map(this.getUserResourceFromWallet);
	}

	public getUsersPage(
		pagination: Contracts.Search.Pagination,
		...criteria: UserCriteria[]
	): Contracts.Search.ResultsPage<UserResource> {
		return this.paginationService.getPage(pagination, [], this.getUsers(...criteria));
	}

	private getUserResourceFromWallet(wallet: Contracts.State.Wallet): UserResource {
		return {
			publicKey: wallet.publicKey!,
			...wallet.getAttribute<Interfaces.IUserPermissions>("guardian.userPermissions"),
		};
	}

	private *getUsers(...criteria: UserCriteria[]): Iterable<UserResource> {
		for (const wallet of this.walletRepository
			.getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer)
			.values()) {
			const userResource = this.getUserResourceFromWallet(wallet);
			if (this.standardCriteriaService.testStandardCriterias(userResource, ...criteria)) {
				yield userResource;
			}
		}
	}
}
