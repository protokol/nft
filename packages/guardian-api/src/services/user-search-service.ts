import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Indexers } from "@protokol/guardian-transactions";

import { UserResource } from "../resources";

@Container.injectable()
export class UserSearchService {
	@Container.inject(Container.Identifiers.PaginationService)
	private readonly paginationService!: Services.Search.PaginationService;

	@Container.inject(Container.Identifiers.WalletRepository)
	@Container.tagged("state", "blockchain")
	private readonly walletRepository!: Contracts.State.WalletRepository;

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

	public getUsersPage(pagination: Contracts.Search.Pagination): Contracts.Search.ResultsPage<UserResource> {
		return this.paginationService.getPage(pagination, [], this.getUsers());
	}

	private getUserResourceFromWallet(wallet: Contracts.State.Wallet): UserResource {
		return {
			publicKey: wallet.publicKey,
			...wallet.getAttribute("guardian.userPermissions"),
		};
	}

	private *getUsers(): Iterable<UserResource> {
		for (const wallet of this.walletRepository
			.getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer)
			.values()) {
			yield this.getUserResourceFromWallet(wallet);
		}
	}
}
