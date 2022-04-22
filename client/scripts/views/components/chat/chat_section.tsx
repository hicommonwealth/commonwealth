/* @jsx m */

import m from 'mithril';
import _ from 'lodash';
import { Icon, Icons, Menu, MenuItem, Spinner, Overlay } from 'construct-ui';

import 'components/sidebar/index.scss';

import { navigateToSubpage } from 'app';
import app from 'state';
import { IChannel } from 'controllers/server/socket/chatNs';
import { WebsocketMessageNames } from 'types';
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

export class ChatSection
  implements m.ClassComponent<{ channels: IChannel[]; activeChannel: string }>
{
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

  async oninit(vnode) {
    this.loaded = false;

    if (_.isEmpty(vnode.attrs.channels)) {
      await app.socket.chatNs.reinit();
      vnode.attrs.channels = Object.values(app.socket.chatNs.channels);
    }

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
    vnode.attrs.channels.forEach((c) => {
      const { ChatMessages, ...metadata } = c;
      this.channels[metadata.category]
        ? this.channels[metadata.category].push(metadata)
        : (this.channels[metadata.category] = [metadata]);
    });

    this.onIncomingMessage = (msg) => {
      if (vnode.attrs.activeChannel)
        app.socket.chatNs.readMessages(vnode.attrs.activeChannel);
      if (msg.chat_channel_id === vnode.attrs.activeChannel) {
        vnode.attrs.channels.find(
          (c) => c.id === msg.chat_channel_id
        ).unread = 0;
      }
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
    if (!_.isEqual(vnode.attrs.channels, old.attrs.channels)) {
      vnode.attrs.channels.forEach((c) => {
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
    if (!this.loaded) return <Spinner />;

    const isAdmin = app.user.isAdminOfEntity({ chain: app.activeChainId() });
    this.channels = {};
    vnode.attrs.channels.forEach((c) => {
      const { ChatMessages, ...metadata } = c;
      this.channels[metadata.category]
        ? this.channels[metadata.category].push(metadata)
        : (this.channels[metadata.category] = [metadata]);
    });

    const channelToggleTree: ToggleTree = {
      toggledState: true,
      children: this.categoryToToggleTree(Object.keys(this.channels), true),
    };

    // Check if an existing toggle tree is stored
    if (!localStorage[`${app.activeChainId()}-chat-toggle-tree`]) {
      console.log('setting toggle tree from scratch');
      localStorage[`${app.activeChainId()}-chat-toggle-tree`] =
        JSON.stringify(channelToggleTree);
    } else if (!verifyCachedToggleTree('chat', channelToggleTree)) {
      console.log(
        'setting chat toggle tree since the cached version differs from the updated version'
      );
      localStorage[`${app.activeChainId()}-chat-toggle-tree`] =
        JSON.stringify(channelToggleTree);
    }
    const toggleTreeState = JSON.parse(
      localStorage[`${app.activeChainId()}-chat-toggle-tree`]
    );

    // ---------- Build Section Props ---------- //

    const sectionAdminButton: m.Vnode = (
      <Icon
        name={Icons.PLUS_CIRCLE}
        onclick={(e) => {
          e.stopPropagation();
          this.adminModals['CreateCategory'] = true;
        }}
      />
    );

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

      const menuComponent = (
        <Menu
          class="admin-menu"
          onmouseenter={handleMouseover}
          onmouseleave={handleMouseout}
        >
          <MenuItem
            iconLeft={Icons.PLUS_CIRCLE}
            label="Add Channel"
            onclick={(e) => {
              handleMenuClick(e, 'CreateChannel');
            }}
          />
          <MenuItem
            iconLeft={Icons.EDIT_2}
            label="Rename Category"
            onclick={(e) => {
              handleMenuClick(e, 'RenameCategory');
            }}
          />
          <MenuItem
            iconLeft={Icons.DELETE}
            label="Delete Category"
            onclick={(e) => {
              handleMenuClick(e, 'DeleteCategory');
            }}
          />
        </Menu>
      );

      return (
        <div>
          <Icon
            name={Icons.EDIT}
            onmouseenter={handleMouseover}
            onmouseleave={handleMouseout}
          />
          {this.menuToggleTree['children'][category]['toggledState'] &&
            menuComponent}
        </div>
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

      const menuComponent = (
        <Menu
          class="admin-menu"
          onmouseenter={handleMouseover}
          onmouseleave={handleMouseout}
        >
          <MenuItem
            iconLeft={Icons.EDIT_2}
            label="Rename Channel"
            onclick={(e) => {
              handleMenuClick(e, 'RenameChannel');
            }}
          />
          <MenuItem
            iconLeft={Icons.DELETE}
            label="Delete Channel"
            onclick={(e) => {
              handleMenuClick(e, 'DeleteChannel');
            }}
          />
        </Menu>
      );

      return (
        <div>
          {channel.unread > 0 && (
            <div class="unread-icon">
              <p>{channel.unread}</p>
            </div>
          )}
          <Icon
            name={Icons.EDIT}
            onmouseenter={handleMouseover}
            onmouseleave={handleMouseout}
          />
          {this.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState'] && menuComponent}
        </div>
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
        onclick: () => {
          navigateToSubpage(`/chat/${channel.id}`);
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
    ) : (
      <div></div>
    );

    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'CHAT',
      hasDefaultToggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setToggleTree('toggledState', toggle);
      },
      displayData: channelData,
      isActive: false,
      rightIcon: isAdmin && sectionAdminButton,
      extraComponents: (
        <Overlay
          class="chatAdminOverlay"
          isOpen={Object.values(this.adminModals).some(Boolean)}
          onClose={closeOverlay}
          closeOnOutsideClick={true}
          content={overlayContent}
        />
      ),
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}
