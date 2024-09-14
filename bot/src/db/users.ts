import { containers } from "./cosmosClient";

export const getUser = async (
  userId: string
): Promise<UserDocument | undefined> => {
  const { resource: user } = await containers.users.item(userId, userId).read();
  return user;
};

export const createOrUpdateUser = async (user: UserDocument) => {
  console.log("Creating or updating user:", user);
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
      "SELECT c.userId FROM c WHERE c.userId IN (@userIds) AND c.isRegistered = true",
    parameters: [
      {
        name: "@userIds",
        value: userIds,
      },
    ],
  };
  try {
    const { resources: registeredUsers } = await containers.users.items
      .query(querySpec)
      .fetchAll();
    const registeredIds = registeredUsers.map((user) => user.id);
    const unregisteredIds = userIds.filter((id) => !registeredIds.includes(id));
    return unregisteredIds;
  } catch (error) {
    console.error("Error fetching unregistered users:", error);
    return [];
  }
};
