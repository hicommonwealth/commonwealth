/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import moment from 'moment';

import 'pages/chat.scss';

import app from 'state';
import { AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import ResizableTextarea from 'views/components/widgets/resizable_textarea';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import { WebsocketMessageNames } from 'types';
import { Icon, Icons, Size } from 'construct-ui';

// how long a wait before visually separating multiple messages sent by the same person
const MESSAGE_GROUPING_DELAY = 300;

const formatTimestampForChat = (timestamp) => {
  timestamp = moment(timestamp);
  if (timestamp.isBefore(moment().subtract(365, 'days')))
    return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(7, 'days')))
    return timestamp.format('MMM D');
  if (timestamp.isBefore(moment().subtract(12, 'hours')))
    return timestamp.format('ddd');
  else return timestamp.format('h:mma');
};

type ChatWindowAttrs = {
  channel_id: string;
};

export class ChatWindow implements m.Component<ChatWindowAttrs> {
  private onIncomingMessage: (any: any) => void;
  private scrollToBottom: () => void;
  private shouldScroll: boolean;

  oninit(vnode) {
    this.shouldScroll = true;
    this.scrollToBottom = () => {
      const scroller = $((vnode as any).dom).find('.chat-messages')[0];
      scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight + 20;
    };
    this.onIncomingMessage = (msg) => {
      const { chat_channel_id } = msg;
      if (chat_channel_id === vnode.attrs.channel_id) {
        this.shouldScroll = false;
      }
      m.redraw();
    };
    app.socket.chatNs.addListener(
      WebsocketMessageNames.ChatMessage,
      this.onIncomingMessage.bind(vnode)
    );
  }

  onremove() {
    app.socket.chatNs.removeListener(
      WebsocketMessageNames.ChatMessage,
      this.onIncomingMessage
    );
  }

  view(vnode) {
    const { channel_id } = vnode.attrs;
    app.socket.chatNs.readMessages(channel_id);
    const channel = app.socket.chatNs.channels[channel_id];
    // group messages; break up groups when the sender changes, or there is a delay of MESSAGE_GROUPING_DELAY
    const groupedMessages = channel.ChatMessages.reduce((acc, msg) => {
      if (
        acc.length > 0 &&
        acc[acc.length - 1].address === msg.address &&
        moment(msg.created_at).diff(
          acc[acc.length - 1].messages[acc[acc.length - 1].messages.length - 1]
            .created_at,
          'seconds'
        ) <= MESSAGE_GROUPING_DELAY
      ) {
        acc[acc.length - 1].messages.push(msg);
      } else {
        acc.push({ address: msg.address, messages: [msg] });
      }
      return acc;
    }, []);

    const handleSubmitMessage = (e) => {
      if (e.type === 'click' || (e.keyCode === 13 && !e.shiftKey)) {
        e.preventDefault();
        if (!app.socket.chatNs.isConnected) return;
        const $textarea = $(e.target)
          .closest('form')
          .find('textarea.ResizableTextarea');
        const message = {
          message: $textarea.val(),
          address: app.user.activeAccount.address,
          chat_channel_id: channel.id,
          now: moment().toISOString(),
        };
        app.socket.chatNs.sendMessage(message, channel);
        $textarea.val('');
      }
    };

    return (
      <div class="ChatPage">
        <div class="chat-messages">
          {groupedMessages.length === 0 && app.socket.chatNs.isConnected && (
            <div class="chat-message-placeholder">No messages yet</div>
          )}
          {groupedMessages.map((grp) => (
            <div class="chat-message-group">
              {m(User, {
                user: new AddressInfo(
                  null,
                  grp.address,
                  app.activeChainId(),
                  null
                ),
                linkify: true,
                avatarSize: 24,
              })}
              <div class="chat-message-group-timestamp">
                {formatTimestampForChat(grp.messages[0].created_at)}
              </div>
              <div class="clear" />
              {grp.messages.map((msg) => (
                <div class="chat-message-text">
                  {m(MarkdownFormattedText, {
                    doc: msg.message,
                    openLinksInNewTab: true,
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        {!app.isLoggedIn() ? (
          <div class="chat-composer-unavailable">Log in to join chat</div>
        ) : !app.user.activeAccount ? (
          <div class="chat-composer-unavailable">
            Set up an account to join chat
          </div>
        ) : !app.socket.chatNs.isConnected ? (
          <div class="chat-composer-unavailable">Waiting for connection</div>
        ) : (
          <form
            class={`chat-composer${
              app.socket.chatNs.isConnected ? '' : ' disabled'
            }`}
          >
            {m(ResizableTextarea, {
              name: 'chat',
              rows: 1,
              disabled: !app.socket.chatNs.isConnected,
              placeholder: app.socket.chatNs.isConnected
                ? 'Enter a message...'
                : 'Disconnected',
              onkeypress: handleSubmitMessage,
            })}
            <Icon
              name={Icons.SEND}
              onclick={handleSubmitMessage}
              size={Size.LG}
            />
          </form>
        )}
      </div>
    );
  }

  onupdate() {
    if (this.shouldScroll) {
      this.scrollToBottom();
    }
  }
}
