import axios from 'axios';
import $ from 'jquery';
import app from 'state';

type getChannelsResp = {
  selectedChannel: { id: string; name: string };
  channels: { id: string; name: string }[];
};

class DiscordController {
  public async createConfig(verification_token: string) {
    try {
      await $.post(`${app.serverUrl()}/createDiscordBotConfig`, {
        community_id: app.activeChainId(),
        verification_token,
        jwt: app.user.jwt,
      });
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  public async setConfig(snapshot_channel_id: string) {
    try {
      await $.post(`${app.serverUrl()}/setDiscordBotConfig`, {
        community_id: app.activeChainId(),
        snapshot_channel_id,
        jwt: app.user.jwt,
      });
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  public async getChannels(community_id: string): Promise<getChannelsResp> {
    try {
      const discordBotConfig = await $.post(
        `${app.serverUrl()}/getDiscordChannels`,
        { community_id, jwt: app.user.jwt },
      );

      return {
        selectedChannel: discordBotConfig.result.selected_channel,
        channels: discordBotConfig.result.channels,
      };
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  public async setForumChannelConnection(
    topicId: string,
    channelId: string | null,
  ) {
    try {
      await axios.patch(
        `${app.serverUrl()}/topics/${topicId}/channels/${channelId}`,
        {
          chain: app.activeChainId(),
          jwt: app.user.jwt,
        },
      );
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }
}

export default DiscordController;
