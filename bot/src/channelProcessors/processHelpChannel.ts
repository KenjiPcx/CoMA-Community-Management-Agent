import {
  Client,
  Collection,
  FetchMessagesOptions,
  Message,
  TextChannel,
} from "discord.js";
import { extractDocs } from "../assistant/tools/extractDocs";

export const processHelpChannel = async (client: Client) => {
  const channelId = process.env.DISCORD_HELP_CHANNEL_ID;
  if (!channelId) {
    throw new Error("No channel ID provided");
  }
  const channel = await client.channels.fetch(channelId);

  if (!(channel instanceof TextChannel)) {
    console.error("Invalid channel");
    return;
  }

  const mins = process.env.DISCORD_MESSAGE_PROCESSING_INTERVAL_MINUTES;
  if (!mins) {
    throw new Error("No minutes provided");
  }
  const interval = new Date(Date.now() - parseInt(mins) * 60 * 1000);

  let messages = new Collection<string, Message>();
  let lastId: string | undefined;

  while (true) {
    const options: FetchMessagesOptions = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    messages = messages.concat(batch);

    if (batch.size < 100 || batch.last()!.createdAt < interval) break;
    lastId = batch.last()!.id;
  }

  messages = messages.filter((msg) => msg.createdAt >= interval);

  await extractDocs(messages.map((msg) => msg.content).reverse());
};
