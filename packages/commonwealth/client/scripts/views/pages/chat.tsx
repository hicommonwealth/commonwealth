import React from 'react';

import { ClassComponent, _DEPRECATED_getSearchParams } from 'mithrilInterop';

import 'pages/chat.scss';

import app from 'state';
import { ChatWindow } from 'views/components/chat/chat_window';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { MixpanelChatEvents } from 'analytics/types';
import withRouter from 'navigation/helpers';

class ChatPageComponent extends ClassComponent {
  oncreate() {
    mixpanelBrowserTrack({
      event: MixpanelChatEvents.CHAT_PAGE_VISIT,
      community: app.activeChainId(),
      isCustomDomain: app.isCustomDomain(),
    });
  }

  view() {
    const activeEntity = app.chain;
    if (!activeEntity) return <PageLoading />;

    if (!app.socket) {
      // Stops un-logged in access
      this.setRoute('/');
    }

    const channel_id = _DEPRECATED_getSearchParams()['channel'];

    return !app.socket.chatNs.hasChannels() ? (
      <PageLoading />
    ) : (
      <Sublayout hideFooter>
        <ChatWindow channel_id={channel_id} />
      </Sublayout>
    );
  }
}

const ChatPage = withRouter(ChatPageComponent);

export default ChatPage;
