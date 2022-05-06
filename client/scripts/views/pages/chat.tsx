/* @jsx m */

import { navigateToSubpage } from 'app';
import m from 'mithril';

import 'pages/chat.scss';

import app from 'state';
import { ChatWindow } from 'views/components/chat/chat_window';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';

const ChatPage: m.Component<never, never> = {
  view: () => {
    const activeEntity = app.chain;
    if (!activeEntity) return <PageLoading />;

    if (!app.socket) navigateToSubpage('/'); // Stops un-logged in access

    const channel_id = m.route.param()['channel'];

    return !app.socket.chatNs.hasChannels() ? (
      <PageLoading />
    ) : (
      <Sublayout hideFooter={true}>
        <ChatWindow channel_id={channel_id} />
      </Sublayout>
    );
  },
};

export default ChatPage;
