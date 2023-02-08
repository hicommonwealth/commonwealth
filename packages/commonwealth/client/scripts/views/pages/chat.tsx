import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';

import 'pages/chat.scss';

import app from 'state';
import { navigateToSubpage } from 'router';
import { ChatWindow } from 'views/components/chat/chat_window';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';

class ChatPage extends ClassComponent {
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

    if (!app.socket) navigateToSubpage('/'); // Stops un-logged in access

    const channel_id = getRouteParam()['channel'];

    return !app.socket.chatNs.hasChannels() ? (
      <PageLoading />
    ) : (
      <Sublayout hideFooter>
        <ChatWindow channel_id={channel_id} />
      </Sublayout>
    );
  }
}

export default ChatPage;
