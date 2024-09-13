import dotenv from "dotenv";
dotenv.config();
import cron from "node-cron";

const token = process.env.DISCORD_TOKEN;

import {
  Client,
  Events,
  GatewayIntentBits,
  Collection,
  ButtonInteraction,
} from "discord.js";
import { processNewMatchmakingMessages } from "./channelProcessors/processMatchmakingChannel";
import { registerCommands } from "./bot/botSetup";

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

interface UserState {
  activeOnboardingSession: boolean;
}
const userState = new Collection<string, UserState>();
const userThreads = new Collection<string, string>();

registerCommands(client);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  cron.schedule("* * * * *", async () => {
    console.log(
      "Running scheduled task to process new messages on matchmaking channel"
    );
    await processNewMatchmakingMessages(client);
  });
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const welcomeMessage = `Welcome to the server, ${member.user.username}! We're glad to have you here. Feel free to introduce yourself in the introductions channel.`;
    await member.send(welcomeMessage);
    console.log(`Sent welcome DM to ${member.user.username}`);

    // // Optionally, you can also send a message to a specific channel announcing the new member
    // const welcomeChannelId = process.env.WELCOME_CHANNEL_ID; // You'll need to set this in your .env file
    // if (welcomeChannelId) {
    //   const welcomeChannel = await client.channels.fetch(welcomeChannelId);
    //   if (welcomeChannel instanceof TextChannel) {
    //     await welcomeChannel.send(`Welcome to the server, ${member.user.toString()}!`);
    //   }
    // }
  } catch (error) {
    console.error(
      `Failed to send welcome message to ${member.user.username}:`,
      error
    );
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
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

  if (interaction.isButton()) {
    const buttonInteraction = interaction as ButtonInteraction;
    const { customId, user, message } = buttonInteraction;
    const [source, action] = customId.split("_");
    console.log(
      `User ${user.id} clicked on a card with id ${customId}, clicked ${action} from source ${source}`
    );
    console.log(`This interaction happened in channel: ${message.channelId}`);

    if (message.guildId) {
      console.log(`This interaction happened in guild: ${message.guildId}`);
    } else {
      console.log("This interaction happened in a DM");
    }

    if (action === "yes") {
      await buttonInteraction.reply(
        `You (${user.username}) clicked Yes on a card from ${source}!`
      );
      // Setup chat here
      userState.set(user.id, { activeOnboardingSession: true });
    } else if (action === "no") {
      await buttonInteraction.reply(
        `You (${user.username}) clicked No on a card from ${source}!`
      );
    }
  }
});

// Log in to Discord with your client's token
client.login(token);
