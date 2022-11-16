/* @jsx m */

import m from 'mithril';
import _ from 'lodash';
import { Icon, Icons, Menu, MenuItem, Overlay } from 'construct-ui';

import 'components/sidebar/index.scss';

import app from 'state';
import { IChannel } from 'controllers/server/socket/chatNs';
import { WebsocketMessageNames } from 'types';
import { handleRedirectClicks } from 'helpers';
import { SidebarSectionGroup } from '../sidebar/sidebar_section';
import {
  CreateCategory,
  CreateChannel,
  RenameCategory,
  RenameChannel,
  DeleteCategory,
  DeleteChannel,
} from './admin_modals';
import {
  ToggleTree,
  SubSectionAttrs,
  SectionGroupAttrs,
  SidebarSectionAttrs,
} from '../sidebar/types';
import { verifyCachedToggleTree } from '../sidebar/helpers';
import { CWSpinner } from '../component_kit/cw_spinner';

enum Errors {
  None = '',
  NotEnabled = 'Chat is not enabled',
  NotLoggedIn = 'Must be logged in to read chat',
}

function setToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-chat-toggle-tree`]
  );
  const split = path.split('.');
  for (const field of split.slice(0, split.length - 1)) {
    if (Object.prototype.hasOwnProperty.call(currentTree, field)) {
      currentTree = currentTree[field];
    } else {
      return;
    }
  }
  currentTree[split[split.length - 1]] = toggle;
  const newTree = currentTree;
  localStorage[`${app.activeChainId()}-chat-toggle-tree`] =
    JSON.stringify(newTree);
}

export class ChatSection implements m.ClassComponent<SidebarSectionAttrs> {
  channels: {
    [category: string]: IChannel[];
  };
  loaded: boolean;
  error: Errors;
  channelToToggleTree: any;
  categoryToToggleTree: any;
  menuToggleTree: ToggleTree;
  adminModals: { [modal: string]: boolean };
  adminCategory: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  adminChannel: IChannel | {};
  onIncomingMessage: (any: any) => void;
  chain: string;
  activeChannel: number;

  async oninit(vnode) {
    this.loaded = false;
    this.chain = app.activeChainId();
    this.activeChannel = null;
    app.socket.chatNs.activeChannel = null;

    this.channelToToggleTree = (channels: IChannel[]) => {
      const toggleTree = {};
      channels.forEach((k) => {
        toggleTree[k.name] = { toggledState: false };
      });
      return toggleTree;
    };

    this.categoryToToggleTree = (
      categories: string[],
      defaultState: boolean
    ) => {
      const toggleTree = {};
      categories.forEach((category) => {
        const channelToggleTree = this.channelToToggleTree(
          this.channels[category]
        );
        toggleTree[category] = {
          toggledState: defaultState,
          children: channelToggleTree,
        };
      });
      return toggleTree;
    };

    this.adminModals = {
      CreateCategory: false,
      CreateChannel: false,
      RenameCategory: false,
      DeleteCategory: false,
      RenameChannel: false,
      DeleteChannel: false,
    };

    this.adminCategory = '';
    this.adminChannel = {};

    this.channels = {};
    Object.values(app.socket.chatNs.channels).forEach((c) => {
      const { ChatMessages, ...metadata } = c;
      this.channels[metadata.category]
        ? this.channels[metadata.category].push(metadata)
        : (this.channels[metadata.category] = [metadata]);
    });

    this.onIncomingMessage = (msg) => {
      m.redraw.sync();
    };

    app.socket.chatNs.addListener(
      WebsocketMessageNames.ChatMessage,
      this.onIncomingMessage.bind(vnode)
    );
    this.loaded = true;

    this.menuToggleTree = {
      // Used to track admin menu render status for hover
      toggledState: false,
      children: this.categoryToToggleTree(Object.keys(this.channels), false),
    };
  }

  onbeforeupdate(vnode, old) {
    if (
      !_.isEqual(Object.values(app.socket.chatNs.channels), old.attrs.channels)
    ) {
      Object.values(app.socket.chatNs.channels).forEach((c) => {
        const { ChatMessages, ...metadata } = c;
        this.channels[metadata.category]
          ? this.channels[metadata.category].push(metadata)
          : (this.channels[metadata.category] = [metadata]);
      });
      this.menuToggleTree = {
        toggledState: false,
        children: this.categoryToToggleTree(Object.keys(this.channels), false),
      };
    }
  }

  onremove() {
    if (app.socket) {
      app.socket.chatNs.removeListener(
        WebsocketMessageNames.ChatMessage,
        this.onIncomingMessage
      );
    }
  }

  view(vnode) {
    if (!app.socket) return;
    if (!this.loaded) return <CWSpinner />;
    this.activeChannel = m.route.param()['channel'];
    app.socket.chatNs.activeChannel = String(this.activeChannel);

    const isAdmin = app.roles.isAdminOfEntity({ chain: app.activeChainId() });
    this.channels = {};
    Object.values(app.socket.chatNs.channels).forEach((c) => {
      const { ChatMessages, ...metadata } = c;
      this.channels[metadata.category]
        ? this.channels[metadata.category].push(metadata)
        : (this.channels[metadata.category] = [metadata]);
    });

    const chatDefaultToggleTree: ToggleTree = {
      toggledState: false,
      children: this.categoryToToggleTree(Object.keys(this.channels), true),
    };

    // Check if an existing toggle tree is stored
    if (!localStorage[`${app.activeChainId()}-chat-toggle-tree`]) {
      localStorage[`${app.activeChainId()}-chat-toggle-tree`] = JSON.stringify(
        chatDefaultToggleTree
      );
    } else if (!verifyCachedToggleTree('chat', chatDefaultToggleTree)) {
      localStorage[`${app.activeChainId()}-chat-toggle-tree`] = JSON.stringify(
        chatDefaultToggleTree
      );
    }
    const toggleTreeState = vnode.attrs.mobile
      ? chatDefaultToggleTree
      : JSON.parse(localStorage[`${app.activeChainId()}-chat-toggle-tree`]);

    // ---------- Build Section Props ---------- //

    const sectionAdminButton: m.Vnode = m(Icon, {
      name: Icons.PLUS_CIRCLE,
      onclick: (e) => {
        e.stopPropagation();
        this.adminModals['CreateCategory'] = true;
      },
    });

    const categoryAdminButton = (category: string): m.Vnode => {
      const handleMouseout = () => {
        if (this.menuToggleTree['children'][category]['toggledState']) {
          this.menuToggleTree['children'][category]['toggledState'] = false;
        }
      };

      const handleMouseover = (e) => {
        if (!this.menuToggleTree['children'][category]['toggledState']) {
          this.menuToggleTree['children'][category]['toggledState'] = true;
          this.adminCategory = category;
        } else {
          e.redraw = false;
          e.stopPropagation();
        }
      };

      const handleMenuClick = (e, modalName) => {
        e.stopPropagation();
        this.adminModals[modalName] = true;
        handleMouseout();
      };

      const menuComponent = m(
        Menu,
        {
          class: 'admin-menu',
          onmouseenter: handleMouseover,
          onmouseleave: handleMouseout,
        },
        [
          m(MenuItem, {
            iconLeft: Icons.PLUS_CIRCLE,
            label: 'Add Channel',
            onclick: (e) => {
              handleMenuClick(e, 'CreateChannel');
            },
          }),
          m(MenuItem, {
            iconLeft: Icons.EDIT_2,
            label: 'Rename Category',
            onclick: (e) => {
              handleMenuClick(e, 'RenameCategory');
            },
          }),
          m(MenuItem, {
            iconLeft: Icons.DELETE,
            label: 'Delete Category',
            onclick: (e) => {
              handleMenuClick(e, 'DeleteCategory');
            },
          }),
        ]
      );

      return (
        <>
          {m(Icon, {
            name: Icons.EDIT,
            onmouseenter: handleMouseover,
            onmouseleave: handleMouseout,
          })}
          {this.menuToggleTree['children'][category]['toggledState'] &&
            menuComponent}
        </>
      );
    };

    const channelRightIcon = (channel: IChannel) => {
      const handleMouseout = () => {
        if (
          this.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState']
        ) {
          this.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState'] = false;
        }
      };

      const handleMouseover = (e) => {
        if (
          !this.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState']
        ) {
          this.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState'] = true;
          this.adminChannel = channel;
        } else {
          e.redraw = false;
          e.stopPropagation();
        }
      };

      const handleMenuClick = (e, modalName) => {
        e.stopPropagation();
        this.adminModals[modalName] = true;
        handleMouseout();
      };

      const menuComponent = m(
        Menu,
        {
          class: 'admin-menu',
          onmouseenter: handleMouseover,
          onmouseleave: handleMouseout,
        },
        [
          m(MenuItem, {
            iconLeft: Icons.EDIT_2,
            label: 'Rename Channel',
            onclick: (e) => {
              handleMenuClick(e, 'RenameChannel');
            },
          }),
          m(MenuItem, {
            iconLeft: Icons.DELETE,
            label: 'Delete Channel',
            onclick: (e) => {
              handleMenuClick(e, 'DeleteChannel');
            },
          }),
        ]
      );

      return (
        <>
          {channel.unread > 0 && (
            <div class="unread-icon">{channel.unread}</div>
          )}
          {m(Icon, {
            name: Icons.EDIT,
            onmouseenter: handleMouseover,
            onmouseleave: handleMouseout,
          })}
          {this.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState'] && menuComponent}
        </>
      );
    };

    const channelToSubSectionProps = (channel: IChannel): SubSectionAttrs => {
      const onChannelPage = (p) =>
        p.startsWith(`/${app.activeChainId()}/chat/${channel.id}`) ||
        (app.isCustomDomain() && p.startsWith(`/chat/${channel.id}`));
      return {
        title: channel.name,
        rowIcon: true,
        isVisible: true,
        isActive: onChannelPage(m.route.get()),
        isUpdated: channel.unread > 0,
        onclick: (e) => {
          handleRedirectClicks(
            e,
            `/chat/${channel.id}`,
            app.activeChainId(),
            () => {
              this.activeChannel = channel.id;
              app.socket.chatNs.activeChannel = String(channel.id);
            }
          );
        },
        rightIcon: isAdmin && channelRightIcon(channel),
      };
    };

    const categoryToSectionGroup = (category: string): SectionGroupAttrs => {
      return {
        title: category,
        containsChildren: true,
        hasDefaultToggle: toggleTreeState['children'][category]['toggledState'],
        isVisible: true,
        isActive: false, // TODO: if any child is active
        isUpdated: false, // TODO: is collapsed and children has unread
        onclick: (e) => {
          e.preventDefault();
        },
        displayData: this.channels[category].map(channelToSubSectionProps),
        rightIcon: isAdmin && categoryAdminButton(category),
      };
    };

    const channelData: SectionGroupAttrs[] = Object.keys(this.channels).map(
      categoryToSectionGroup
    );

    const closeOverlay = () => {
      Object.keys(this.adminModals).forEach((k) => {
        this.adminModals[k] = false;
      });
      m.redraw();
    };

    const overlayContent: m.Vnode = this.adminModals['CreateCategory'] ? (
      <CreateCategory handleClose={closeOverlay} />
    ) : this.adminModals['CreateChannel'] ? (
      <CreateChannel handleClose={closeOverlay} category={this.adminCategory} />
    ) : this.adminModals['RenameCategory'] ? (
      <RenameCategory
        handleClose={closeOverlay}
        category={this.adminCategory}
      />
    ) : this.adminModals['RenameChannel'] ? (
      <RenameChannel handleClose={closeOverlay} channel={this.adminChannel} />
    ) : this.adminModals['DeleteCategory'] ? (
      <DeleteCategory
        handleClose={closeOverlay}
        category={this.adminCategory}
      />
    ) : this.adminModals['DeleteChannel'] ? (
      <DeleteChannel handleClose={closeOverlay} channel={this.adminChannel} />
    ) : null;

    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'Chat',
      className: 'ChatSection',
      hasDefaultToggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setToggleTree('toggledState', toggle);
      },
      displayData: channelData,
      isActive: false,
      rightIcon: isAdmin && sectionAdminButton,
      extraComponents: m(Overlay, {
        class: 'chatAdminOverlay',
        isOpen: Object.values(this.adminModals).some(Boolean),
        onClose: closeOverlay,
        closeOnOutsideClick: true,
        content: overlayContent,
      }),
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}
