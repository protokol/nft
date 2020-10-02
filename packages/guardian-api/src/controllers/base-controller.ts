import { Controller } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";

import { Identifiers } from "../identifiers";
import { GroupSearchService, UserSearchService } from "../services";

@Container.injectable()
export class BaseController extends Controller {
	@Container.inject(Identifiers.UserSearchService)
	protected readonly userSearchService!: UserSearchService;

	@Container.inject(Identifiers.GroupSearchService)
	protected readonly groupSearchService!: GroupSearchService;
}
