/* @jsx m */

import { navigateToSubpage } from 'app';
import m from 'mithril';

import 'pages/chat.scss';

import app from 'state';
import { ChatWindow } from 'views/components/chat/chat_window';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { MixpanelChatEvents } from 'analytics/types';

const ChatPage: m.Component<never, never> = {
  oncreate() {
    mixpanelBrowserTrack({
      event: MixpanelChatEvents.CHAT_PAGE_VISIT,
      community: app.activeChainId(),
      isCustomDomain: app.isCustomDomain(),
    });
  },

  view: () => {
    const activeEntity = app.chain;
    if (!activeEntity) return <PageLoading />;

    if (!app.socket) navigateToSubpage('/'); // Stops un-logged in access

    const channel_id = m.route.param()['channel'];

    return !app.socket.chatNs.hasChannels() ? (
      <PageLoading />
    ) : (
      <Sublayout hideFooter>
        <ChatWindow channel_id={channel_id} />
      </Sublayout>
    );
  },
};

export default ChatPage;
