import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { groupCriteriaSchemaObject } from "../resources";
import { BaseController } from "./base-controller";

@Container.injectable()
export class GroupsController extends BaseController {
	public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const pagination = this.getQueryPagination(request.query);
		const sorting = request.query.orderBy as Contracts.Search.Sorting;
		const criteria = this.getQueryCriteria(request.query, groupCriteriaSchemaObject);

		return this.groupSearchService.getGroupsPage(pagination, sorting, criteria);
	}

	public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const group = await this.groupSearchService.getGroup(request.params.id);
		if (!group) {
			return Boom.notFound("Group not found");
		}

		return { data: group };
	}

	public async showUsers(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const group = await this.groupSearchService.getGroup(request.params.id);
		if (!group) {
			return Boom.notFound("Group not found");
		}

		const users = this.userSearchService.getUsersByGroup(group.name);
		return { data: users };
	}
}
