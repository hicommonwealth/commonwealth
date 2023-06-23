import axios from 'axios';
import { AppError } from 'common-common/src/errors';
import { validateChain } from '../middleware/validateChain';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

enum SetDiscordBotConfigErrors {
  NoChain = 'Must supply a chain ID',
  NotAdmin = 'Not an admin',
  CommonbotConnected = 'Discord is already connected to another Commonwealth community',
  Error = 'Could not set discord bot config',
  TokenExpired = 'Token expired',
}

type GetDiscordChannelsReq = {
  chain_id: string;
};

type GetDiscordChannelsResp = {
  channels: {
    id: string;
    name: string;
  }[];
  selected_channel: {
    id: string;
    name: string;
  } | null;
};

const getDiscordChannels = async (
  models: DB,
  req: TypedRequestBody<GetDiscordChannelsReq>,
  res: TypedResponse<GetDiscordChannelsResp>
) => {
  const { chain_id } = req.body;

  const [chain, error] = await validateChain(models, { chain_id });
  if (!chain_id || error) throw new AppError(SetDiscordBotConfigErrors.NoChain);

  const configEntry = await models.DiscordBotConfig.findOne({
    where: {
      chain_id,
    },
  });

  console.log('configEntry', configEntry);

  try {
    console.log(`${process.env.DISCORD_BOT_URL}/channel-listing`);
    const channels = await axios.post(
      `${process.env.DISCORD_BOT_URL}/channel-listing`,
      { guildId: configEntry.guild_id },
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    return success(res, {
      channels: channels.data.channels.map((channel) => {
        return { id: channel.id, name: channel.name };
      }),
      selected_channel: {
        id: configEntry.snapshot_channel_id,
        name: channels.data.channels.find(
          (channel) => channel.id === configEntry.snapshot_channel_id
        )?.name,
      },
    });
  } catch (e) {
    console.log('Error getting discord channel listing', e);
  }
};

export default getDiscordChannels;
