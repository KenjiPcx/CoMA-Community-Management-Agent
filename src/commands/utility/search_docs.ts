const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search_docs")
    .setDescription("Search for docs in the help channel"),
  async execute(interaction: any) {
    // Dummy reply
    await interaction.reply("Pong!");
  },
};
