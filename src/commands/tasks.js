const { SlashCommandBuilder } = require("@discordjs/builders");
const task = require("../schemas/task");
const conf = require("../configs/config.json");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
	conf: {
		aliases: ["tasks"],
		name: "görevler",
		help: "görevler [kullanıcı]?",
		enabled: conf.coinSystem,
		slash: true
	},

	slashOptions: new SlashCommandBuilder()
		.setName("görevler")
		.setDescription("Belirtilen kullanıcının ya da sizin görevlerinizi gösterir.")
		.addUserOption((option) => option.setName("kullanıcı").setDescription("Görevleri gösterilecek olan kullanıcı.").setRequired(false)),

	/**
	 * @returns {Promise<void>}
	 */
	run: async ({ client, message, args, embed, reply, interaction }) => {
		if (!conf.coinSystem) return reply({ embeds: [embed.setDescription("Coin sistemi kapalı olduğu için bu komutu kullanamazsınız!")] });
		const member = interaction
			? interaction.options.getUser("kullanıcı") ? interaction.guild.members.cache.get(interaction.options.getUser("kullanıcı").id) : interaction.member
			: message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
		const tasks = await task.find({ guildID: member.guild.id, userID: member.user.id });
		embed.setThumbnail("https://img.itch.zone/aW1nLzIzNzE5MzEuZ2lm/original/GcEpW9.gif");
		reply({
			embeds: [
				embed.setDescription(`
			Toplam Görev Sayısı: \`${tasks.length}\`
			Tamamlanmış Görev Sayısı: \`${tasks.filter((x) => x.completed).length}\`
			Tamamlanmamış Görev Sayısı: \`${tasks.filter((x) => !x.completed).length}\`
			Aktif Görev Sayısı: \`${tasks.filter((x) => x.active).length}\`
			
			${tasks
				.filter((x) => x.active)
				.map(
					(x) =>
						`\`#${x.id}\` ${x.message} \n${
							x.completedCount >= x.count
								? conf.emojis.coin + " **Tamamlandı!**"
								: `${client.progressBar(x.completedCount, x.count, 8)} \`${
										x.type === "ses"
											? `${moment.duration(x.completedCount).format("H [saat], m [dk], s [sn]")} / ${moment.duration(x.count).format("H [saat], m [dk], s [sn]")}`
											: `${x.completedCount} / ${x.count}`
								  }\` \nKalan Süre: \`${x.finishDate - Date.now() > 0 ? moment.duration(x.finishDate - Date.now()).format("H [saat], m [dakika] s [saniye]") : "0 saniye"}\` \nÖdül: ${conf.emojis.coin} \`${x.prizeCount} coin\``
						}`
				)
				.join("\n\n")}
			`)
			]
		});
	}
};
