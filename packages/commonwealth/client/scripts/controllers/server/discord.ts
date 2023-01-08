import $ from 'jquery';
import app from 'state';

type getChannelsResp = {
  selectedChannel: { id: string; name: string };
  channels: { id: string; name: string }[];
};
class DiscordController {
  public async createConfig(verification_token: string) {
    try {
      await $.post(`${navState.serverUrl()}/createDiscordBotConfig`, {
        chain_id: navState.activeChainId(),
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
      await $.post(`${navState.serverUrl()}/setDiscordBotConfig`, {
        chain_id: navState.activeChainId(),
        snapshot_channel_id,
        jwt: app.user.jwt,
      });
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  public async getChannels(chain_id: string): Promise<getChannelsResp> {
    try {
      const discordBotConfig = await $.post(
        `${navState.serverUrl()}/getDiscordChannels`,
        { chain_id, jwt: app.user.jwt }
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
}

export default DiscordController;
