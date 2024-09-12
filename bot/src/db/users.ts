import { containers, UserDocument } from "./cosmosClient";

export const getUser = async (
  userId: string
): Promise<UserDocument | undefined> => {
  const { resource: user } = await containers.users.item(userId, userId).read();
  return user;
};

export const createOrUpdateUser = async (user: UserDocument) => {
  await containers.users.items.upsert(user);
};

export const softCreateUser = async (discordUserId: string) => {
  const newUser: UserDocument = {
    userId: discordUserId,
    username: "",
    isRegistered: false,
    lastInteraction: new Date(),
  };
  await createOrUpdateUser(newUser);
};

export const getUnregisteredUsersFromIds = async (userIds: string[]) => {
  const querySpec = {
    query:
      "SELECT c.id FROM c WHERE c.id IN (@userIds) AND c.registered = true)",
    parameters: [
      {
        name: "@userIds",
        value: userIds,
      },
    ],
  };
  const { resources: registeredUsers } = await containers.users.items
    .query(querySpec)
    .fetchAll();
  const registeredIds = registeredUsers.map((user) => user.id);
  const unregisteredIds = userIds.filter((id) => !registeredIds.includes(id));
  return unregisteredIds;
};
