import dotenv from "dotenv";
dotenv.config();
import cron from "node-cron";

const token = process.env.DISCORD_TOKEN;

import {
  Client,
  GatewayIntentBits,
  Collection,
  ButtonInteraction,
  ChannelType,
  Events,
  Message,
} from "discord.js";
import {
  startAssistantSession,
  processMessageWithAssistant,
} from "./assistant/assistantUtils";
import { registerCommands } from "./bot/botSetup";
import { processNewMatchmakingMessages } from "./channelProcessors/processMatchmakingChannel";
import { autoQnA } from "./assistant/autoQnA";
import { processHelpChannel } from "./channelProcessors/processHelpChannel";

export interface CustomClient extends Client {
  commands: Collection<string, any>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
}) as CustomClient;

type userStore = {
  threadId: string;
  assistantType: "onboarding" | "search_user" | "search_docs";
};
export const userThreads = new Collection<string, userStore>();

registerCommands(client);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  const cronString = process.env.DISCORD_MESSAGE_PROCESSING_INTERVAL_CRON;
  if (!cronString) {
    throw new Error("No cron string provided");
  }
  cron.schedule(cronString, async () => {
    await processNewMatchmakingMessages(client);
  });

  cron.schedule(cronString, async () => {
    await processHelpChannel(client);
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { user } = interaction;

    // Custom command
    if (interaction.commandName === "search_user") {
      await interaction.reply({
        content:
          "Starting a thread to search for users... Check your DMs! Let's talk over there",
        ephemeral: true,
      });
      // Start a thread and DM the user
      await startAssistantSession(
        "search_user",
        `User: ${user.id}, username: ${user.username}`,
        user.id
      );
      await user.send(
        "Hey there, use me to find people to build with, testing your product, or to just chat with! Just let me know what you're looking for and I'll help you find the right people!"
      );
      return;
    }

    if (interaction.commandName === "search_docs") {
      await interaction.reply({
        content:
          "Starting a thread to search for docs... Check your DMs! Let's talk over there",
        ephemeral: true,
      });
      // Start a thread and DM the user
      await startAssistantSession(
        "search_docs",
        `User: ${user.id}, username: ${user.username}`,
        user.id
      );
      await user.send(
        "Hey there, use me to find documentation for anything in this community! I have been here for a while and have seen all the docs shared in this channel. I can help you find the right documentation for your needs!"
      );
      return;
    }

    // Command handler
    const command = (interaction.client as CustomClient).commands.get(
      interaction.commandName
    );
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  }

  // Handle start onboarding button
  if (interaction.isButton()) {
    const buttonInteraction = interaction as ButtonInteraction;
    const { customId, user } = buttonInteraction;
    const [source, action] = customId.split("_");
    console.log(
      `User ${user.id} clicked on a card with id ${customId}, clicked ${action} from source ${source}`
    );

    if (action === "yes") {
      await buttonInteraction.reply(
        `Cool, let's start by asking you a few questions to get your profile setup!`
      );
      // Setup chat here
      await startAssistantSession(
        "onboarding",
        `User: ${user.id}, username: ${user.username}`,
        user.id
      );
    } else if (action === "no") {
      await buttonInteraction.reply(
        `You (${user.username}) clicked No on a card from ${source}!`
      );
    }
  }
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  const userId = message.author.id;

  // Handle onboarding chat
  if (message.channel.type === ChannelType.DM) {
    if (userThreads.has(userId)) {
      console.log(
        `User ${userId} has a thread id ${userThreads.get(userId)?.threadId}`
      );
      const store = userThreads.get(userId) as userStore;
      const response = await processMessageWithAssistant(
        store.assistantType,
        store.threadId,
        message.content
      );
      console.log(`Response from assistant: ${response}`);
      await message.reply(response);
    }
  }

  // Help channel:
  if (process.env.AUTO_QNA === "true" && message.channel.type === ChannelType.GuildText) {
    if (message.channel.id === process.env.DISCORD_HELP_CHANNEL_ID) {
      const res = await autoQnA(message);
      if (res !== `""`) {
        await message.reply(res);
      }
    }
  }
});

// Log in to Discord with your client's token
client.login(token);
