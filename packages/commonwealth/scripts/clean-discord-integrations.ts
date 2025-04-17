import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Client, GatewayIntentBits } from 'discord.js';
import { Op } from 'sequelize';
import { config } from '../server/config';

async function deleteDiscordConfig(community_id: string) {
  await models.sequelize.transaction(async (transaction) => {
    await models.Community.update(
      { discord_config_id: null },
      {
        where: {
          id: community_id,
        },
        transaction,
      },
    );
    await models.DiscordBotConfig.destroy({
      where: {
        community_id,
      },
      transaction,
    });
  });
}

async function main() {
  const communitiesToMaintain = [
    'Dinero',
    'Madlads',
    'Siennanetwork',
    'Divastaking',
    'Sandbox',
    'Cryptocats',
    'Pawthereum',
    'Tangle',
    'Qwoyn-network',
    'Sake Finance',
    'Edgeware',
    'Common',
    'Sentinel',
    'Oraichain',
    'Unilend',
  ];

  const toLeaveCommunities = await models.DiscordBotConfig.findAll({
    attributes: ['community_id', 'guild_id'],
    where: {
      community_id: { [Op.notIn]: communitiesToMaintain },
    },
  });

  // Remove discord configs that are incomplete
  const cleanedToLeaveCommunities: {
    community_id: string;
    guild_id: string;
  }[] = [];
  for (const com of toLeaveCommunities) {
    try {
      if (!com.guild_id || com.guild_id === '') {
        await deleteDiscordConfig(com.community_id);
      } else {
        cleanedToLeaveCommunities.push({
          community_id: com.community_id,
          guild_id: com.guild_id,
        });
      }
    } catch (e) {
      console.error(
        'Failed to delete discord config for community ID: ',
        com.community_id,
        ' with error:',
      );
      console.error(e);
    }
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  async function leaveGuild() {
    for (const com of cleanedToLeaveCommunities) {
      try {
        const guild = client.guilds.cache.get(com.guild_id);
        if (guild) {
          await guild.leave();
          console.log(
            `Successfully left the server: ${guild.name} for Common community ID: ${com.community_id}`,
          );
        } else {
          console.log(`Could not find a server with ID: ${com.guild_id}`);
        }
      } catch (error) {
        console.error(`Failed to leave the server: ${error}`);
      }

      try {
        await deleteDiscordConfig(com.community_id);
      } catch (error) {
        console.error(
          'Failed to deleted Discord bot config for community ID' +
            ` ${com.community_id}, guild id ${com.guild_id}: ${error}`,
        );
      }
    }
  }
  client.once('ready', () => {
    leaveGuild()
      .then(() => console.log('Guild exodus complete.'))
      .catch((e) => console.error(e));
  });

  await client.login(config.DISCORD.BOT_TOKEN);
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      console.log('Started...');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      // dispose()('EXIT', true);
    })
    .catch((err) => {
      console.log('Failed to set super admin', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
