import 'pages/chat.scss';

import m from 'mithril';
import _ from 'lodash';

import app from 'state';
import ChatWindow from 'views/components/chat/chat_window';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';

const ChatPage: m.Component<never, never> = {
  view: () => {
    const activeEntity = app.chain;
    if (!activeEntity) return m(PageLoading);

    if (!app.socket) m.route.set(`/${app.activeChainId()}`); // Stops un-logged in access

    const channel_id = m.route.param()['channel'];

    return !app.socket.chatNs.hasChannels()
      ? m(PageLoading)
      : m(Sublayout, [
          m('.chat-page', [
            m(ChatWindow, {
              channel_id,
            }),
          ]),
        ]);
  },
};

export default ChatPage;
