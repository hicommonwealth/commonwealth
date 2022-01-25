import 'pages/chat.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment';

import app from 'state';
import { WebsocketMessageType } from 'types';

import { AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import ResizableTextarea from 'views/components/widgets/resizable_textarea';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import PageLoading from 'views/pages/loading';
import { Button } from 'construct-ui';

// how long a wait before visually separating multiple messages sent by the same person
const MESSAGE_GROUPING_DELAY = 300;

const formatTimestampForChat = (timestamp) => {
  if (timestamp.isBefore(moment().subtract(365, 'days'))) return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(7, 'days'))) return timestamp.format('MMM D');
  if (timestamp.isBefore(moment().subtract(12, 'hours'))) return timestamp.format('ddd');
  else return timestamp.format('h:mma');
};

interface IAttrs {
  channel_id: number;
  all_channel_ids: number[];
}

interface IState {
  oninput: CallableFunction | boolean;
  onincomingmessage: (any: any) => void;
  messages: Record<number, any[]>;
  channels: any[];
  loaded: boolean;
}

const Chat: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    app.socket.chatNs.connectToChannels(vnode.attrs['all_channel_ids'])
    vnode.state.onincomingmessage = (payload: any) => {
      console.log('listener fired:', payload)
      // const {id, address, message, chat_channel_id, created_at} = payload
      // const { address, message, chat_channel_id} = payload
      console.log(payload)
      m.redraw()
    };

    app.socket.chatNs.addListener(WebsocketMessageType.ChatMessage, vnode.state.onincomingmessage.bind(vnode));
    vnode.state.messages = vnode.attrs.all_channel_ids.reduce((acc:any, curr) => {acc[curr] = []; return acc}, {})
  },
  onremove: (vnode) => {
    app.socket.chatNs.disconnectFromChannels(vnode.attrs['all_channel_ids'])
    app.socket.chatNs.removeListener(WebsocketMessageType.ChatMessage, vnode.state.onincomingmessage)
  },
  view: (vnode) => {
    const { channel_id } = vnode.attrs;
    // group messages; break up groups when the sender changes, or there is a delay of MESSAGE_GROUPING_DELAY
    const groupedMessages = vnode.state.messages[channel_id].reduce((acc, msg) => {
      if (acc.length > 0
       && acc[acc.length - 1].address === msg.address
       && msg.timestamp.diff(
         acc[acc.length - 1].messages[acc[acc.length - 1].messages.length - 1].timestamp,
         'seconds',
       ) <= MESSAGE_GROUPING_DELAY) {
        acc[acc.length - 1].messages.push(msg);
      } else {
        acc.push({ sender: msg.sender, messages: [msg] });
      }
      return acc;
    }, []);

    return m('.Chat', [
      m('.chat-messages', [
        groupedMessages.length === 0 && app.socket.chatNs.isConnected
          && m('.chat-message-placeholder', 'No messages yet'),
        groupedMessages.map((grp) => m('.chat-message-group', [
          m(User, { user: new AddressInfo(null, grp.sender.address, grp.sender.chain, null), linkify: true }),
          m('.chat-message-group-timestamp', formatTimestampForChat(grp.messages[0].timestamp)),
          m('.clear'),
          grp.messages.map((msg) => m('.chat-message-text', [
            m(MarkdownFormattedText, { doc: msg.text }),
          ])),
        ])),
      ]),
      !app.isLoggedIn() ? m('.chat-composer-unavailable', 'Log in to join chat')
        : !app.user.activeAccount ? m('.chat-composer-unavailable', 'Set up account to join chat')
          : !app.socket.chatNs.isConnected ? m('.chat-composer-unavailable', 'Waiting for connection')
            : m('form.chat-composer', [
              m(ResizableTextarea, {
                name: 'chat',
                rows: 1,
                class: app.socket.chatNs.isConnected ? '' : 'disabled',
                disabled: !app.socket.chatNs.isConnected,
                placeholder: app.socket.chatNs.isConnected ? 'Enter a message...' : 'Disconnected',
                onkeypress: (e) => {
                  // submit on enter
                  if (e.keyCode === 13 && !e.shiftKey) {
                    e.preventDefault();
                    if (!app.socket.chatNs.isConnected) return;
                    const $textarea = $(e.target).closest('form').find('textarea.ResizableTextarea');
                    const message = {
                        message: $textarea.val(),
                        address: app.user.activeAccount.address,
                        chat_channel_id: channel_id
                    };
                    app.socket.chatNs.sendMessage(message);
                    $textarea.val('');
                  }
                },
              }),
            ]),
    ]);
  },
};

const ChatPage = {
  view: (vnode) => {
    const activeEntity = app.chain;
    if (!activeEntity) return m(PageLoading);
    const channel_id = 1;
    const all_channel_ids = [ channel_id ]
    console.log(app.chain.id)

    return m(Sublayout, {
      class: 'ChatPage',
    }, [
      m(Button, { label: 'Add', onclick: () => (app.socket.chatNs.createChatChannel('Test', app.chain.id))}),
      m(Chat, { channel_id, all_channel_ids }),
    ]);
  },
};

export default ChatPage;
