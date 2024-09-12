import { Client, Collection, FetchMessagesOptions, Message, TextChannel } from "discord.js";
import { getUnregisteredUsersFromIds } from "../db/users";

export const processNewMatchmakingMessages = async (client: Client) => {
  const channelId = "1283235142739169362";
  const channel = await client.channels.fetch(channelId);

  if (!(channel instanceof TextChannel)) {
    console.error("Invalid channel");
    return;
  }

  const halfHourAgo = new Date(Date.now() - 30 * 60 * 1000);
  let messages = new Collection<string, Message>();
  let lastId: string | undefined;

  while (true) {
    const options: FetchMessagesOptions = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    messages = messages.concat(batch);

    if (batch.size < 100 || batch.last()!.createdAt < halfHourAgo) break;
    lastId = batch.last()!.id;
  }

  messages = messages.filter((msg) => msg.createdAt >= halfHourAgo);

  const uniqueUserIds = new Set<string>();
  messages.forEach((message: Message) => {
    uniqueUserIds.add(message.author.id);
  });

  const unregisteredUserIds = await getUnregisteredUsersFromIds(
    Array.from(uniqueUserIds)
  );
  for (const userId of unregisteredUserIds) {
    try {
      const user = await client.users.fetch(userId);
      await user.send(
        "Welcome! You've been noticed in our channel. Here's some important information..."
      );
      console.log(`Sent DM to user ${userId}`);
    } catch (error) {
      console.error(`Failed to send DM to user ${userId}:`, error);
    }
  }
}
