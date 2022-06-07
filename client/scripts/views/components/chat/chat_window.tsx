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
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { MixpanelChatEvents } from 'analytics/types';
import { Icons, Icon } from 'construct-ui';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

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
  private shouldScrollToHighlight: boolean;

  oninit(vnode) {
    this.shouldScroll = true;
    this.shouldScrollToHighlight = Boolean(m.route.param("message"))
    this.scrollToBottom = () => {
      const scroller = $((vnode as any).dom).find('.chat-messages')[0];
      scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight + 20;
    };
    this.onIncomingMessage = (msg) => {
      console.log('Message received');
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

        if ($textarea.val().toString().length === 0) {
          return;
        }

        const message = {
          message: $textarea.val(),
          chat_channel_id: channel.id,
        };
        app.socket.chatNs.sendMessage(message);
        mixpanelBrowserTrack({
          event: MixpanelChatEvents.NEW_CHAT_SENT,
          community: app.activeChainId(),
          isCustomDomain: app.isCustomDomain(),
        });
        $textarea.val('');
      }
    };

    const messageIsHighlighted = (message: any): boolean => {
      return m.route.param('message') && Number(m.route.param('message')) === message.id
    }

    return (
      <div class="ChatPage">
        <div class="chat-messages">
          {groupedMessages.length === 0 && app.socket.chatNs.isConnected && (
            <div class="no-messages-container">
              <div class="no-messages-placeholder">No messages yet</div>
            </div>
          )}
          {groupedMessages.map((grp) => (
            <div
              class="chat-message-group"
              id={grp.messages.some(messageIsHighlighted) ? "highlighted" : ""}
            >
              <div class="user-and-timestamp-container">
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
                <Icon name={Icons.LINK} onclick={async () => {
                  const route = m.route.get().indexOf("?") > -1
                    ? m.route.get().slice(0, m.route.get().indexOf("?"))
                    : m.route.get()
                  navigator.clipboard.writeText(
                    `https://commonwealth.im${route}?message=${grp.messages[0].id}`
                  )
                    .then(() => notifySuccess("Message link copied to clipboard"))
                    .catch(() => notifyError("Could not copy link to keyboard"))
                  this.shouldScroll = false;
                }}></Icon>
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
            <CWIcon iconName="send" onclick={handleSubmitMessage} />
          </form>
        )}
      </div>
    );
  }

  onupdate() {
    if (this.shouldScroll) {
      if(this.shouldScrollToHighlight) {
        const element = document.getElementById("highlighted")
        element.scrollIntoView({behavior: "smooth"})
        this.shouldScrollToHighlight = false
        this.shouldScroll = false
      } else {
        this.scrollToBottom();
      }
    }
  }
}
