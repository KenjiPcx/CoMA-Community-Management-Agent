import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getUnregisteredUsersFromIds as extractIds } from "../db/users";
export async function getUnregisteredUsersFromIds(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const body = (await request.json()) as { userIds: string[] };
  const userIds = body.userIds;

  const unregisteredUsers = await extractIds(userIds);
  return { body: JSON.stringify(unregisteredUsers) };
}

app.http("getUnregisteredUsersFromIds", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: getUnregisteredUsersFromIds,
});
