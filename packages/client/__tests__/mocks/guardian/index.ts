import { ProtokolConnection } from "../../../src";
import { mockGuardianConfigurations } from "./configurations";
import { mockGuardianGroups } from "./groups";
import { mockGuardianUsers } from "./users";

export const configureGuardianMocks = <T>(resource): T => {
	const host = "https://example.net:4003/api";

	mockGuardianConfigurations(host);
	mockGuardianGroups(host);
	mockGuardianUsers(host);

	return new resource(new ProtokolConnection(host));
};
