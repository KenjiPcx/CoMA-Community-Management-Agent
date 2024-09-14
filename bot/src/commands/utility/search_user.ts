const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search_user")
    .setDescription(
      "Search for teammates / people building similar things / people to test your product"
    ),
  async execute(interaction: any) {
    // Dummy reply
    await interaction.reply("Pong!");
  },
};
