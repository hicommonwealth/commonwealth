/* @jsx m */

import 'components/sidebar/index.scss';

/* eslint-disable @typescript-eslint/ban-types */

import m from 'mithril';
import _ from 'lodash';
import { Icon, Icons, Menu, MenuItem, Spinner, Overlay } from 'construct-ui';

import { navigateToSubpage } from 'app';
import app from 'state';
import { IChannel } from 'controllers/server/socket/chatNs';
import { WebsocketMessageType } from 'types';
import {
  SidebarSection,
  SidebarSectionAttrs,
  SectionGroupAttrs,
  SubSectionAttrs,
} from '../sidebar/sidebar_section';
import { ToggleTree, verifyCachedToggleTree } from '../sidebar';
import {
  CreateCategory,
  CreateChannel,
  RenameCategory,
  RenameChannel,
  DeleteCategory,
  DeleteChannel,
} from './admin_modals';

enum Errors {
  None = '',
  NotEnabled = 'Chat is not enabled',
  NotLoggedIn = 'Must be logged in to read chat',
}
interface IState {
  channels: {
    [category: string]: IChannel[];
  };
  loaded: boolean;
  error: Errors;
  channelToToggleTree: Function;
  categoryToToggleTree: Function;
  menuToggleTree: ToggleTree;
  adminModals: { [modal: string]: boolean };
  adminCategory: string;
  adminChannel: IChannel | {};
  onincomingmessage: (any: any) => void;
}

function setToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-chat-toggle-tree`]
  );
  const split = path.split('.');
  for (const field of split.slice(0, split.length - 1)) {
    if (currentTree.hasOwnProperty(field)) {
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

export const ChatSection: m.Component<
  { channels: IChannel[]; activeChannel: string },
  IState
> = {
  oninit: async (vnode) => {
    vnode.state.loaded = false;

    if (_.isEmpty(vnode.attrs.channels)) {
      await app.socket.chatNs.reinit();
      vnode.attrs.channels = Object.values(app.socket.chatNs.channels);
    }

    vnode.state.channelToToggleTree = (channels: IChannel[]) => {
      const toggleTree = {};
      channels.forEach((k) => {
        toggleTree[k.name] = { toggledState: false };
      });
      return toggleTree;
    };

    vnode.state.categoryToToggleTree = (
      categories: string[],
      defaultState: boolean
    ) => {
      const toggleTree = {};
      categories.forEach((category) => {
        const channelToggleTree = vnode.state.channelToToggleTree(
          vnode.state.channels[category]
        );
        toggleTree[category] = {
          toggledState: defaultState,
          children: channelToggleTree,
        };
      });
      return toggleTree;
    };

    vnode.state.adminModals = {
      CreateCategory: false,
      CreateChannel: false,
      RenameCategory: false,
      DeleteCategory: false,
      RenameChannel: false,
      DeleteChannel: false,
    };

    vnode.state.adminCategory = '';
    vnode.state.adminChannel = {};

    vnode.state.channels = {};
    vnode.attrs.channels.forEach((c) => {
      const { ChatMessages, ...metadata } = c;
      vnode.state.channels[metadata.category]
        ? vnode.state.channels[metadata.category].push(metadata)
        : (vnode.state.channels[metadata.category] = [metadata]);
    });

    vnode.state.onincomingmessage = (msg) => {
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
      WebsocketMessageType.ChatMessage,
      vnode.state.onincomingmessage.bind(vnode)
    );
    vnode.state.loaded = true;

    vnode.state.menuToggleTree = {
      // Used to track admin menu render status for hover
      toggledState: false,
      children: vnode.state.categoryToToggleTree(
        Object.keys(vnode.state.channels),
        false
      ),
    };
  },
  onbeforeupdate: (vnode, old) => {
    if (!_.isEqual(vnode.attrs.channels, old.attrs.channels)) {
      vnode.attrs.channels.forEach((c) => {
        const { ChatMessages, ...metadata } = c;
        vnode.state.channels[metadata.category]
          ? vnode.state.channels[metadata.category].push(metadata)
          : (vnode.state.channels[metadata.category] = [metadata]);
      });
      vnode.state.menuToggleTree = {
        toggledState: false,
        children: vnode.state.categoryToToggleTree(
          Object.keys(vnode.state.channels),
          false
        ),
      };
    }
  },
  onremove: (vnode) => {
    if (app.socket) {
      app.socket.chatNs.removeListener(
        WebsocketMessageType.ChatMessage,
        vnode.state.onincomingmessage
      );
    }
  },
  view: (vnode) => {
    if (!app.socket) return <div>No</div>;
    if (!vnode.state.loaded) return <Spinner></Spinner>;
    vnode.state.channels = {};
    vnode.attrs.channels.forEach((c) => {
      const { ChatMessages, ...metadata } = c;
      vnode.state.channels[metadata.category]
        ? vnode.state.channels[metadata.category].push(metadata)
        : (vnode.state.channels[metadata.category] = [metadata]);
    });

    const channelToggleTree: ToggleTree = {
      toggledState: true,
      children: vnode.state.categoryToToggleTree(
        Object.keys(vnode.state.channels),
        true
      ),
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
          vnode.state.adminModals['CreateCategory'] = true;
        }}
      />
    );

    const categoryAdminButton = (category: string): m.Vnode => {
      const handleMouseout = () => {
        if (vnode.state.menuToggleTree['children'][category]['toggledState']) {
          vnode.state.menuToggleTree['children'][category]['toggledState'] =
            false;
        }
      };

      const handleMouseover = (e) => {
        if (!vnode.state.menuToggleTree['children'][category]['toggledState']) {
          vnode.state.menuToggleTree['children'][category]['toggledState'] =
            true;
          vnode.state.adminCategory = category;
        } else {
          e.redraw = false;
          e.stopPropagation();
        }
      };

      const handleMenuClick = (e, modalName) => {
        e.stopPropagation();
        vnode.state.adminModals[modalName] = true;
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
          {vnode.state.menuToggleTree['children'][category]['toggledState'] &&
            menuComponent}
        </div>
      );
    };

    const channelRightIcon = (channel: IChannel) => {
      const handleMouseout = () => {
        if (
          vnode.state.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState']
        ) {
          vnode.state.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState'] = false;
        }
      };

      const handleMouseover = (e) => {
        if (
          !vnode.state.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState']
        ) {
          vnode.state.menuToggleTree['children'][channel.category]['children'][
            channel.name
          ]['toggledState'] = true;
          vnode.state.adminChannel = channel;
        } else {
          e.redraw = false;
          e.stopPropagation();
        }
      };

      const handleMenuClick = (e, modalName) => {
        e.stopPropagation();
        vnode.state.adminModals[modalName] = true;
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
          {vnode.state.menuToggleTree['children'][channel.category]['children'][
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
        rightIcon: channelRightIcon(channel),
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
        displayData: vnode.state.channels[category].map(
          channelToSubSectionProps
        ),
        rightIcon: categoryAdminButton(category),
      };
    };

    const channelData: SectionGroupAttrs[] = Object.keys(
      vnode.state.channels
    ).map(categoryToSectionGroup);

    const closeOverlay = () => {
      Object.keys(vnode.state.adminModals).forEach((k) => {
        vnode.state.adminModals[k] = false;
      });
      m.redraw();
    };
    const overlayContent: m.Vnode = vnode.state.adminModals[
      'CreateCategory'
    ] ? (
      <CreateCategory handleClose={closeOverlay} />
    ) : vnode.state.adminModals['CreateChannel'] ? (
      <CreateChannel
        handleClose={closeOverlay}
        category={vnode.state.adminCategory}
      />
    ) : vnode.state.adminModals['RenameCategory'] ? (
      <RenameCategory
        handleClose={closeOverlay}
        category={vnode.state.adminCategory}
      />
    ) : vnode.state.adminModals['RenameChannel'] ? (
      <RenameChannel
        handleClose={closeOverlay}
        channel={vnode.state.adminChannel}
      />
    ) : vnode.state.adminModals['DeleteCategory'] ? (
      <DeleteCategory
        handleClose={closeOverlay}
        category={vnode.state.adminCategory}
      />
    ) : vnode.state.adminModals['DeleteChannel'] ? (
      <DeleteChannel
        handleClose={closeOverlay}
        channel={vnode.state.adminChannel}
      />
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
      rightIcon: sectionAdminButton,
      extraComponents: (
        <Overlay
          class="chatAdminOverlay"
          isOpen={Object.values(vnode.state.adminModals).some(Boolean)}
          onClose={closeOverlay}
          closeOnOutsideClick={true}
          content={overlayContent}
        />
      ),
    };

    return m(SidebarSection, { ...sidebarSectionData });
  },
};
