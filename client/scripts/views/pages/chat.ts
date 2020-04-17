import 'pages/chat.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';

import { link, isSameAccount } from 'helpers';
import app from 'state';
import ChatController from 'controllers/server/socket/chat';
import User from 'views/components/widgets/user';
import ResizableTextarea from 'views/components/widgets/resizable_textarea';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import PageLoading from 'views/pages/loading';

// how often outgoing typing indicators get sent
const TYPING_INDICATOR_OUTGOING_FREQUENCY = 1000;
// how long an incoming typing indicator sticks around for
const TYPING_INDICATOR_INCOMING_PERSISTENCE = 2000;
// how long a wait before visually separating multiple messages sent by the same person
const MESSAGE_GROUPING_DELAY = 300;
// websocket purpose
const SOCKET_PURPOSE = 'chat';

const formatTimestampForChat = (timestamp) => {
  if (timestamp.isBefore(moment().subtract(365, 'days'))) return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(7, 'days'))) return timestamp.format('MMM D');
  if (timestamp.isBefore(moment().subtract(12, 'hours'))) return timestamp.format('ddd');
  else return timestamp.format('h:mma');
};

interface IAttrs {
  name: string;
  room: string;
}

interface IState {
  collapsed: boolean;
  oninput: CallableFunction;
  outgoingTypingInputHandler: CallableFunction;
  chat: IChat;
  messages: any[];
  typing?: boolean;
  typingTimeout: any;
  loaded: boolean;
}

interface IChat {
  isConnected?: boolean;
}

const Chat = {
  oninit: (vnode) => {
    vnode.state.collapsed = !!localStorage.getItem('cwChatCollapsed');

    // initialize chat controller and handlers
    const scrollToChatBottom = () => {
      // Use a synchronous redraw, or otherwise it may not happen in time for us to read the correct scrollHeight
      m.redraw.sync();
      const scroller = $(vnode.dom).find('.chat-messages')[0];
      scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight + 20;
    };
    const onIncomingMessage = (text, author, author_chain, timestamp?) => {
      const sender = { address: author, chain: author_chain };
      vnode.state.messages.push({ sender, text, timestamp: timestamp || moment() });
      vnode.state.typing = false;
      scrollToChatBottom();
    };
    const onIncomingTypingIndicator = () => {
      vnode.state.typing = true;
      m.redraw();
      if (vnode.state.typingTimeout) clearTimeout(vnode.state.typingTimeout);
      vnode.state.typingTimeout = setTimeout(() => {
        vnode.state.typing = false;
        m.redraw();
      }, TYPING_INDICATOR_INCOMING_PERSISTENCE);
    };
    const server = CHAT_SERVER.startsWith('localhost') ? `ws://${CHAT_SERVER}` : `wss://${CHAT_SERVER}`;
    const chatRoomUrl = `${server}/?room=${vnode.attrs.room}`;
    vnode.state.chat = new ChatController(chatRoomUrl, SOCKET_PURPOSE, app.login.jwt, (connected) => {
      if (connected) {
        vnode.state.messages = [];
        vnode.state.chat.initializeScrollback(app.login.jwt);
        scrollToChatBottom();
      }
    });
    vnode.state.chat.addListener(onIncomingMessage);
    vnode.state.chat.addTypingListener(onIncomingTypingIndicator);
    vnode.state.messages = [];
    vnode.state.outgoingTypingInputHandler = _.throttle((e) => {
      if (!vnode.state.chat.isConnected) return;
      if (e && e.target && $(e.target).val() === '') return;
      vnode.state.chat.sendTypingIndicator(app.login.jwt);
    }, TYPING_INDICATOR_OUTGOING_FREQUENCY, { leading: true, trailing: false });
  },
  view: (vnode) => {
    const { name } = vnode.attrs;
    // group messages; break up groups when the sender changes, or there is a delay of MESSAGE_GROUPING_DELAY
    const groupedMessages = vnode.state.messages.reduce((acc, msg) => {
      (acc.length > 0
       && acc[acc.length - 1].sender.address === msg.sender.address
       && acc[acc.length - 1].sender.chain === msg.sender.chain
       && msg.timestamp.diff(
         acc[acc.length - 1].messages[acc[acc.length - 1].messages.length - 1].timestamp,
         'seconds',
       ) <= MESSAGE_GROUPING_DELAY
      )
        ? acc[acc.length - 1].messages.push(msg)
        : acc.push({ sender: msg.sender, messages: [msg] });
      return acc;
    }, []);

    return m('.Chat', [
      m('.chat-messages', [
        groupedMessages.length === 0 && vnode.state.chat.isConnected
          && m('.chat-message-placeholder', 'No messages yet'),
        groupedMessages.map((grp) => m('.chat-message-group', [
          m(User, { user: [grp.sender.address, grp.sender.chain], linkify: true }),
          m('.chat-message-group-timestamp', formatTimestampForChat(grp.messages[0].timestamp)),
          m('.clear'),
          grp.messages.map((msg) => m('.chat-message-text', [
            m(MarkdownFormattedText, { doc: msg.text }),
          ])),
        ])),
      ]),
      !app.isLoggedIn() ? m('.chat-composer-unavailable', 'Log in to join chat')
        : !app.vm.activeAccount ? m('.chat-composer-unavailable', 'Set up account to join chat')
        : !vnode.state.chat.isConnected ? m('.chat-composer-unavailable', 'Waiting for connection')
        : m('form.chat-composer', [
          m(ResizableTextarea, {
            name: 'chat',
            rows: 1,
            class: vnode.state.chat.isConnected ? '' : 'disabled',
            disabled: !vnode.state.chat.isConnected,
            placeholder: vnode.state.chat.isConnected ? 'Enter a message...' : 'Disconnected',
            oncreate: (vnode2) => $(vnode2.dom).focus(),
            oninput: vnode.state.outgoingTypingInputHandler,
            onkeydown: (e) => {
              // collapse on escape
              if (e.keyCode === 27) {
                e.preventDefault();
                vnode.state.collapsed = true;
                localStorage.setItem('cwChatCollapsed', 'true');
              }
            },
            onkeypress: (e) => {
              // submit on enter
              if (e.keyCode === 13 && !e.shiftKey) {
                e.preventDefault();
                if (!vnode.state.chat.isConnected) return;
                const $textarea = $(e.target).closest('form').find('textarea.ResizableTextarea');
                const message = $textarea.val();
                vnode.state.chat.send('message', message, app.vm.activeAccount, app.login.jwt);
                vnode.state.oninput = false; // HACK: clear the typing debounce
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
    const activeEntity = app.chain ? app.chain : app.community;
    if (!activeEntity) return m(PageLoading);
    const room = activeEntity.id;
    const name = app.chain ? app.chain.meta.chain.name : app.community.meta.name;

    return m('.ChatPage', [
      m(Chat, { room, name }),
    ]);
  },
};

export default ChatPage;
