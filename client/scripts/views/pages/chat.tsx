/* @jsx m */

import 'pages/chat.scss';

import m from 'mithril';
import _ from 'lodash'
import moment from 'moment';

import app from 'state';
import ChatWindow from 'views/components/chat/chat_window';
import PageLoading from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { WebsocketMessageType } from 'types';

interface IChannel {
  id: number,
  name: string,
  unread: number,
  messages: any[],
}

interface IState {
  loaded: boolean,
  onincomingmessage: (any: any) => void,
  channels: Record<number, IChannel>,
  activeChannel: number;
}

const ChatPage: m.Component<never, IState> = {
  oninit: async (vnode) => {
    vnode.state.loaded = false;
    vnode.state.channels = {};
    const all_messages = await app.socket.chatNs.getChatMessages()
    all_messages.forEach(channel => {
      const { ChatMessages, id, name } = channel
      vnode.state.channels[id] = { id, name, unread: 0, messages: ChatMessages }
    });

    if(all_messages.length > 0) vnode.state.activeChannel = all_messages[0].id

    vnode.state.onincomingmessage = (payload: any) => {
      const { id, address, message, chat_channel_id, created_at } = payload
      vnode.state.channels[chat_channel_id].messages.push({
        id,
        message,
        address,
        created_at: moment(created_at),
      })
      if (chat_channel_id !== vnode.state.activeChannel) {
        vnode.state.channels[chat_channel_id].unread++;
      }
      m.redraw();
    }
    app.socket.chatNs.connectToChannels(Object.keys(vnode.state.channels).map(id => Number(id)))
    app.socket.chatNs.addListener(WebsocketMessageType.ChatMessage, vnode.state.onincomingmessage.bind(vnode));
    vnode.state.loaded = true;
    m.redraw()
  },
  onremove: (vnode) => {
    app.socket.chatNs.disconnectFromChannels(Object.keys(vnode.state.channels).map(id => Number(id)))
    app.socket.chatNs.removeListener(WebsocketMessageType.ChatMessage, vnode.state.onincomingmessage)
  },
  view: (vnode) => {
    const activeEntity = app.chain;
    if (!activeEntity) return <PageLoading />;

    const activeChannel = Number(m.route.param()['channel'])
    console.log(activeChannel)

    return vnode.state.loaded
      ? _.isEmpty(vnode.state.channels)
        ? <PageLoading />
        : <Sublayout>
            <div class="chat-page">
              <ChatWindow
                channel_id={vnode.state.activeChannel}
                messages={vnode.state.channels[vnode.state.activeChannel].messages}
              />
            </div>
          </Sublayout>
      : <PageLoading />
  },
};

export default ChatPage;
