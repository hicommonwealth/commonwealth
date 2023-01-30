/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/sidebar/index.scss';
// import { Icon, Icons, Menu, MenuItem, Overlay } from 'construct-ui';
import type { IChannel } from 'controllers/server/socket/chatNs';
import { handleRedirectClicks } from 'helpers';

import app from 'state';
import { WebsocketMessageNames } from 'types';
import { CWSpinner } from '../component_kit/cw_spinner';
import { verifyCachedToggleTree } from '../sidebar/helpers';
import { NavigationWrapper } from 'mithrilInterop/helpers';
import { SidebarSectionGroup } from '../sidebar/sidebar_section';
import type {
  SectionGroupAttrs,
  SidebarSectionAttrs,
  SubSectionAttrs,
  ToggleTree,
} from '../sidebar/types';
import {
  CreateCategory,
  CreateChannel,
  DeleteCategory,
  DeleteChannel,
  RenameCategory,
  RenameChannel,
} from './admin_modals';

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

class ChatSectionComponent extends ClassComponent<SidebarSectionAttrs> {
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

  async oninit(vnode: ResultNode<SidebarSectionAttrs>) {
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
      redraw(true);
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

  onremove() {
    if (app.socket) {
      app.socket.chatNs.removeListener(
        WebsocketMessageNames.ChatMessage,
        this.onIncomingMessage
      );
    }
  }

  view() {
    if (!app.socket) return;
    if (!this.loaded) return <CWSpinner />;
    this.activeChannel = getRouteParam()['channel'];
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
    const toggleTreeState = JSON.parse(
      localStorage[`${app.activeChainId()}-chat-toggle-tree`]
    );

    // ---------- Build Section Props ---------- //

    // @TODO @REACT FIX ME
    // const sectionAdminButton: ResultNode = m(Icon, {
    //   name: Icons.PLUS_CIRCLE,
    //   onClick: (e) => {
    //     e.stopPropagation();
    //     this.adminModals['CreateCategory'] = true;
    //   },
    // });

    const categoryAdminButton = (category: string): ResultNode => {
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

      // @TODO @REACT FIX ME
      // const menuComponent = m(
      //   Menu,
      //   {
      //     class: 'admin-menu',
      //     onMouseEnter: handleMouseover,
      //     onMouseLeave: handleMouseout,
      //   },
      //   [
      //     m(MenuItem, {
      //       iconLeft: Icons.PLUS_CIRCLE,
      //       label: 'Add Channel',
      //       onClick: (e) => {
      //         handleMenuClick(e, 'CreateChannel');
      //       },
      //     }),
      //     m(MenuItem, {
      //       iconLeft: Icons.EDIT_2,
      //       label: 'Rename Category',
      //       onClick: (e) => {
      //         handleMenuClick(e, 'RenameCategory');
      //       },
      //     }),
      //     m(MenuItem, {
      //       iconLeft: Icons.DELETE,
      //       label: 'Delete Category',
      //       onClick: (e) => {
      //         handleMenuClick(e, 'DeleteCategory');
      //       },
      //     }),
      //   ]
      // );
      return null; // @TODO @REACT Fix me
      // return (
      //   <React.Fragment>
      //     {m(Icon, {
      //       name: Icons.EDIT,
      //       onMouseEnter: handleMouseover,
      //       onMouseLeave: handleMouseout,
      //     })}
      //     {this.menuToggleTree['children'][category]['toggledState'] &&
      //       menuComponent}
      //   </React.Fragment>
      // );
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

      // @TODO @REACT FIX ME
      // const menuComponent = m(
      //   Menu,
      //   {
      //     class: 'admin-menu',
      //     onMouseEnter: handleMouseover,
      //     onMouseLeave: handleMouseout,
      //   },
      //   [
      //     m(MenuItem, {
      //       iconLeft: Icons.EDIT_2,
      //       label: 'Rename Channel',
      //       onClick: (e) => {
      //         handleMenuClick(e, 'RenameChannel');
      //       },
      //     }),
      //     m(MenuItem, {
      //       iconLeft: Icons.DELETE,
      //       label: 'Delete Channel',
      //       onClick: (e) => {
      //         handleMenuClick(e, 'DeleteChannel');
      //       },
      //     }),
      //   ]
      // );

      return null; // @TODO @REACT FIX ME
      // return (
      //   <React.Fragment>
      //     {channel.unread > 0 && (
      //       <div className="unread-icon">{channel.unread}</div>
      //     )}
      //     {m(Icon, {
      //       name: Icons.EDIT,
      //       onMouseEnter: handleMouseover,
      //       onMouseLeave: handleMouseout,
      //     })}
      //     {this.menuToggleTree['children'][channel.category]['children'][
      //       channel.name
      //     ]['toggledState'] && menuComponent}
      //   </React.Fragment>
      // );
    };

    const channelToSubSectionProps = (channel: IChannel): SubSectionAttrs => {
      const onChannelPage = (p) =>
        p.startsWith(`/${app.activeChainId()}/chat/${channel.id}`) ||
        (app.isCustomDomain() && p.startsWith(`/chat/${channel.id}`));
      return {
        title: channel.name,
        rowIcon: true,
        isVisible: true,
        isActive: onChannelPage(getRoute()),
        isUpdated: channel.unread > 0,
        onClick: (e) => {
          handleRedirectClicks(
            this,
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
        onClick: (e) => {
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
      redraw();
    };

    // TODO: @ZAK @REACT
    // const overlayContent: ResultNode = this.adminModals['CreateCategory'] ? (
    //   <CreateCategory handleClose={closeOverlay} />
    // ) : this.adminModals['CreateChannel'] ? (
    //   <CreateChannel handleClose={closeOverlay} category={this.adminCategory} />
    // ) : this.adminModals['RenameCategory'] ? (
    //   <RenameCategory
    //     handleClose={closeOverlay}
    //     category={this.adminCategory}
    //   />
    // ) : this.adminModals['RenameChannel'] ? (
    //   <RenameChannel handleClose={closeOverlay} channel={this.adminChannel} />
    // ) : this.adminModals['DeleteCategory'] ? (
    //   <DeleteCategory
    //     handleClose={closeOverlay}
    //     category={this.adminCategory}
    //   />
    // ) : this.adminModals['DeleteChannel'] ? (
    //   <DeleteChannel handleClose={closeOverlay} channel={this.adminChannel} />
    // ) : null;

    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'Chat',
      className: 'ChatSection',
      hasDefaultToggle: toggleTreeState['toggledState'],
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        setToggleTree('toggledState', toggle);
      },
      displayData: channelData,
      isActive: false,
      // rightIcon: isAdmin && sectionAdminButton, // @TODO @REACT FIX ME
      // extraComponents: m(Overlay, {
      //   class: 'chatAdminOverlay',
      //   isOpen: Object.values(this.adminModals).some(Boolean),
      //   onClose: closeOverlay,
      //   closeOnOutsideClick: true,
      //   content: overlayContent,
      // }),
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}

export const ChatSection = NavigationWrapper(ChatSectionComponent);
