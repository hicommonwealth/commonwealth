import axios from 'axios';
import app from 'state';
import { userStore } from 'state/ui/user';

class DiscordController {
  public async createConfig(verification_token: string) {
    try {
      await axios.post(`${app.serverUrl()}/createDiscordBotConfig`, {
        community_id: app.activeChainId(),
        verification_token,
        jwt: userStore.getState().jwt,
      });
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
          jwt: userStore.getState().jwt,
        },
      );
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }
}

export default DiscordController;
