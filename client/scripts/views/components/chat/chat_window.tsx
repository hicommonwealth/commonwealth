/* @jsx m */

import 'pages/chat.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment';

import app from 'state';

import { AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import ResizableTextarea from 'views/components/widgets/resizable_textarea';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import { WebsocketMessageType } from 'types';

// how long a wait before visually separating multiple messages sent by the same person
const MESSAGE_GROUPING_DELAY = 300;

const formatTimestampForChat = (timestamp) => {
  timestamp = moment(timestamp)
  if (timestamp.isBefore(moment().subtract(365, 'days'))) return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(7, 'days'))) return timestamp.format('MMM D');
  if (timestamp.isBefore(moment().subtract(12, 'hours'))) return timestamp.format('ddd');
  else return timestamp.format('h:mma');
};

interface IAttrs {
  channel_id: number,
  messages: any[],
}

interface IState {
  scrollToBottom: () => void,
  onincomingmessage: (any: any) => void,
  shouldScroll: boolean,
}

const ChatWindow: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.state.shouldScroll = true;
    vnode.state.scrollToBottom = () => {
        const scroller = $((vnode as any).dom).find('.chat-messages')[0];
        scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight + 20;
    };
    vnode.state.onincomingmessage = (msg) => {
        const { chat_channel_id } = msg
        if(chat_channel_id === vnode.attrs.channel_id) {
            vnode.state.shouldScroll = false;
        }
    }
    app.socket.chatNs.addListener(WebsocketMessageType.ChatMessage, vnode.state.onincomingmessage.bind(vnode));
  },
  onremove: (vnode) => {
    app.socket.chatNs.removeListener(WebsocketMessageType.ChatMessage, vnode.state.onincomingmessage)
  },
  view: (vnode) => {
    const { channel_id, messages } = vnode.attrs;
    // group messages; break up groups when the sender changes, or there is a delay of MESSAGE_GROUPING_DELAY
    const groupedMessages = messages.reduce((acc, msg) => {
      if (acc.length > 0
       && acc[acc.length - 1].address === msg.address
       && moment(msg.created_at).diff(
         acc[acc.length - 1].messages[acc[acc.length - 1].messages.length - 1].created_at,
         'seconds',
       ) <= MESSAGE_GROUPING_DELAY) {
        acc[acc.length - 1].messages.push(msg);
      } else {
        acc.push({ address: msg.address, messages: [msg] });
      }
      return acc;
    }, []);

    const handleSubmitMessage = (e) => {
      if (e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault();
        if (!app.socket.chatNs.isConnected) return;
        const $textarea = $(e.target).closest('form').find('textarea.ResizableTextarea');
        const message = {
            message: $textarea.val(),
            address: app.user.activeAccount.address,
            chat_channel_id: channel_id,
            now: moment().toISOString()
        };
        app.socket.chatNs.sendMessage(message);
        $textarea.val('');
      }
    }

    return <div class="chat-window">
      <div class="chat-messages">
        { groupedMessages.length === 0 && app.socket.chatNs.isConnected &&
          <div class="chat-message-placeholder">No messages yet</div> }
        { groupedMessages.map(grp =>
        <div class="chat-message-group">
          { grp.messages.map(msg =>
            <div class="chat-message-text">
              {m(MarkdownFormattedText, { doc: msg.message })}
            </div>
          )}
          <div class="clear" />
          {m(User, {
            user: new AddressInfo(null, grp.address, app.activeChainId(), null),
            linkify: true
          })}
          <div class="chat-message-group-timestamp">{formatTimestampForChat(grp.messages[0].created_at)}</div>
        </div>)}
      </div>

      { !app.isLoggedIn() ? <div class='chat-composer-unavailable'>Log in to join chat</div> :
          !app.user.activeAccount ? <div class='chat-composer-unavailable'>Set up an account to join chat</div> :
            !app.socket.chatNs.isConnected ? <div class='chat-composer-unavailable'>Waiting for connection</div> :
              <form class={`chat-composer${app.socket.chatNs.isConnected ? '' : ' disabled'}`}>
                {m(ResizableTextarea, {
                  name: "chat",
                  rows: 1,
                  disabled: !app.socket.chatNs.isConnected,
                  placeholder: app.socket.chatNs.isConnected ? 'Enter a message...' : 'Disconnected',
                  onkeypress: handleSubmitMessage
                })}
              </form>
      }
    </div>;
  },
  onupdate: (vnode) => {
    if(vnode.state.shouldScroll) {
        vnode.state.scrollToBottom()
    }
  },
};

export default ChatWindow