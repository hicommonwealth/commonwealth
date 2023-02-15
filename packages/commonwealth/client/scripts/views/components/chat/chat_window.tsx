/* @jsx m */

import { MixpanelChatEvents } from 'analytics/types';
import ClassComponent from 'class_component';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { isActiveAddressPermitted } from 'controllers/server/roles';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import $ from 'jquery';
import m from 'mithril';
import moment from 'moment';

import 'pages/chat.scss';

import { Action } from 'commonwealth/shared/permissions';
import app from 'state';
import { WebsocketMessageNames } from 'types';
import User from 'views/components/widgets/user';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { renderQuillTextBody } from '../quill/helpers';
import type { QuillEditor } from '../quill/quill_editor';

import { QuillEditorComponent } from '../quill/quill_editor_component';
import AddressAccount from 'models/AddressAccount';

// how long a wait before visually separating multiple messages sent by the same person
const MESSAGE_GROUPING_DELAY = 300;

const formatTimestampForChat = (timestamp: moment.Moment) => {
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

export class ChatWindow extends ClassComponent<ChatWindowAttrs> {
  private onIncomingMessage: (any: any) => void;
  private scrollToBottom: () => void;
  private shouldScroll: boolean;
  private shouldScrollToHighlight: boolean;
  private quillEditorState: QuillEditor;
  private channel;
  private hideChat: boolean;

  private _handleSubmitMessage = () => {
    if (this.quillEditorState.isBlank()) {
      notifyError('Cannot send a blank message');
      return;
    }

    const bodyText = this.quillEditorState.textContentsAsString;
    this.quillEditorState.disable();

    const message = {
      message: bodyText,
      chat_channel_id: this.channel.id,
      address: app.user.activeAddressAccount.address,
    };
    app.socket.chatNs.sendMessage(message);
    this.quillEditorState.enable();

    mixpanelBrowserTrack({
      event: MixpanelChatEvents.NEW_CHAT_SENT,
      community: app.activeChainId(),
      isCustomDomain: app.isCustomDomain(),
    });
  };

  private _messageIsHighlighted = (message: any): boolean => {
    return (
      m.route.param('message') &&
      Number(m.route.param('message')) === message.id
    );
  };

  oninit(vnode: m.VnodeDOM<ChatWindowAttrs, this>) {
    const activeAddressRoles = app.roles.getAllRolesInCommunity({
      chain: app.activeChainId(),
    });
    const currentChainInfo = app.chain?.meta;
    this.hideChat =
      !currentChainInfo ||
      !activeAddressRoles ||
      !isActiveAddressPermitted(
        activeAddressRoles,
        currentChainInfo,
        Action.VIEW_CHAT_CHANNELS
      );
    if (this.hideChat) return;

    this.shouldScroll = true;
    this.shouldScrollToHighlight = Boolean(m.route.param('message'));

    this.scrollToBottom = () => {
      const scroller = $(vnode.dom).find('.chat-messages')[0];
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

  view(vnode: m.Vnode<ChatWindowAttrs>) {
    if (this.hideChat) return;

    const { channel_id } = vnode.attrs;
    app.socket.chatNs.readMessages(channel_id);
    this.channel = app.socket.chatNs.channels[channel_id];
    // group messages; break up groups when the sender changes, or there is a delay of MESSAGE_GROUPING_DELAY
    const groupedMessages = this.channel.ChatMessages.reduce((acc, msg) => {
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
              id={
                grp.messages.some(this._messageIsHighlighted)
                  ? 'highlighted'
                  : ''
              }
            >
              <div class="user-and-timestamp-container">
                {m(User, {
                  user: new AddressAccount({
                    address: grp.address,
                    chain: app.config.chains.getById(app.activeChainId()),
                  }),
                  linkify: true,
                  avatarSize: 24,
                })}
                <div class="chat-message-group-timestamp">
                  {formatTimestampForChat(grp.messages[0].created_at)}
                </div>
                <CWIconButton
                  iconName="copy"
                  iconSize="small"
                  onclick={() => async () => {
                    const route = app.socket.chatNs.getRouteToMessage(
                      grp.messages[0].chat_channel_id,
                      grp.messages[0].id,
                      app.chain.id
                    );
                    navigator.clipboard
                      .writeText(
                        `${window.location.protocol}//${window.location.host}${route}`
                      )
                      .then(() =>
                        notifySuccess('Message link copied to clipboard')
                      )
                      .catch(() =>
                        notifyError('Could not copy link to keyboard')
                      );
                    this.shouldScroll = false;
                  }}
                />
              </div>
              <div class="clear" />
              {grp.messages.map((msg) => (
                <div class="chat-message-text">
                  {renderQuillTextBody(msg.message, {
                    openLinksInNewTab: true,
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        {!app.isLoggedIn() ? (
          <div class="chat-composer-unavailable">Log in to join chat</div>
        ) : !app.user.activeAddressAccount ? (
          <div class="chat-composer-unavailable">
            Set up an account to join chat
          </div>
        ) : !app.socket.chatNs.isConnected ? (
          <div class="chat-composer-unavailable">Waiting for connection</div>
        ) : (
          <div
            class={`chat-composer${
              app.socket.chatNs.isConnected ? '' : ' disabled'
            }`}
          >
            <QuillEditorComponent
              // TODO Graham 7/20/22: I hate this usage of contentsDoc—can it be improved?
              contentsDoc=""
              oncreateBind={(state: QuillEditor) => {
                this.quillEditorState = state;
              }}
              editorNamespace={`${document.location.pathname}-chatting`}
              onkeyboardSubmit={() => {
                this._handleSubmitMessage();
              }}
            />
            <CWIcon iconName="send" onclick={this._handleSubmitMessage} />
          </div>
        )}
      </div>
    );
  }

  onupdate() {
    if (this.shouldScroll) {
      if (this.shouldScrollToHighlight) {
        const element = document.getElementById('highlighted');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          this.scrollToBottom();
        }
        this.shouldScrollToHighlight = false;
        this.shouldScroll = false;
      } else {
        this.scrollToBottom();
      }
    }
  }
}
