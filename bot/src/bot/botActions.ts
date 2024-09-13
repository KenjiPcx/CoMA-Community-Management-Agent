import {
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  Guild,
  User,
  userMention,
} from "discord.js";

export const sendCardWithButtons = async (
  client: Client,
  target: User | Guild,
  title: string,
  question: string,
  idPrefix: string
) => {
  try {
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(title)
      .setDescription(question)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${idPrefix}_yes`)
        .setLabel("Yes")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`${idPrefix}_no`)
        .setLabel("No")
        .setStyle(ButtonStyle.Danger)
    );

    if (target instanceof Guild) {
      const channel = await client.channels.fetch(target.id);
      if (
        !channel ||
        !channel.isTextBased() ||
        !(channel instanceof TextChannel)
      )
        return;

      await channel.send({
        content: userMention(target.id),
        embeds: [embed],
        components: [row],
      });
    } else if (target instanceof User) {
      await target.send({ embeds: [embed], components: [row] });
    }
  } catch (error) {
    console.error("Error sending card with buttons:", error);
  }
};
