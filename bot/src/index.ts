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
  SlashCommandBuilder,
} from "discord.js";
import {
  startAssistantSession,
  processMessageWithAssistant,
} from "./assistant/assistantUtils";
import { registerCommands } from "./bot/botSetup";
import { processNewMatchmakingMessages } from "./channelProcessors/processMatchmakingChannel";

export interface CustomClient extends Client {
  commands: Collection<string, any>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    // GatewayIntentBits.GuildMembers,
    // GatewayIntentBits.GuildEmojisAndStickers,
    // GatewayIntentBits.GuildIntegrations,
    // GatewayIntentBits.GuildWebhooks,
    // GatewayIntentBits.GuildInvites,
  ],
}) as CustomClient;

type userStore = { threadId: string; assistantType: "onboarding" | "search" };
export const userThreads = new Collection<string, userStore>();

registerCommands(client);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  cron.schedule("* * * * *", async () => {
    await processNewMatchmakingMessages(client);
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
        "search",
        `User: ${user.id}, username: ${user.username}`,
        user.id
      );
      await user.send(
        "Hey there, use me to find people to build with, testing your product, or to just chat with! Just let me know what you're looking for and I'll help you find the right people!"
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
    const { customId, user, message } = buttonInteraction;
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
  const userInput = message.content;

  if (message.channel.type === ChannelType.DM) {
    if (userThreads.has(userId)) {
      console.log(
        `User ${userId} has a thread id ${userThreads.get(userId)?.threadId}`
      );
      const store = userThreads.get(userId) as userStore;
      const response = await processMessageWithAssistant(
        store.assistantType,
        store.threadId,
        userInput
      );
      console.log(`Response from assistant: ${response}`);
      await message.reply(response);
    }
  }
});

// Log in to Discord with your client's token
client.login(token);
