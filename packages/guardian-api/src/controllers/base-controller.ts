import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@protokol/guardian-crypto";

@Container.injectable()
export class BaseController extends Controller {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.CacheService)
    @Container.tagged("cache", "@protokol/guardian-transactions")
    protected readonly groupsPermissionsCache!: Contracts.Kernel.CacheStore<
        Interfaces.GuardianGroupPermissionsAsset["name"],
        Interfaces.GuardianGroupPermissionsAsset
    >;
}
