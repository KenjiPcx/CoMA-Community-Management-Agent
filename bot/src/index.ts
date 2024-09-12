import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import cron from "node-cron";

const token = process.env.DISCORD_TOKEN;

import { Client, Events, GatewayIntentBits, Collection } from "discord.js";
import { processNewMatchmakingMessages } from "./channelProcessors/processMatchmakingChannel";

interface CustomClient extends Client {
  commands: Collection<string, any>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
  ],
}) as CustomClient;

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  cron.schedule("0 * * * *", async () => {
    console.log("Running scheduled task to process new messages on matchmaking channel");
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
  if (!interaction.isChatInputCommand()) return;

  const command = (interaction.client as CustomClient).commands.get(
    interaction.commandName
  );

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
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
});

// Log in to Discord with your client's token
client.login(token);
