/* eslint-disable @typescript-eslint/ban-types */
/* @jsx m */
import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import { Icon, Icons, Menu, MenuItem, Spinner, Overlay } from 'construct-ui'
import { navigateToSubpage } from 'app';
import app from 'state';
import { ChatErrors, IChannel } from 'controllers/server/socket/chatNs';
import { WebsocketMessageNames } from 'types';
import SidebarSection, { SidebarSectionProps, SectionGroupProps, SubSectionProps } from '../sidebar/sidebar_section';
import { ToggleTree, verifyCachedToggleTree } from '../sidebar';
import {
    CreateCategory,
    CreateChannel,
    RenameCategory,
    RenameChannel,
    DeleteCategory,
    DeleteChannel } from './admin_modals'
import ErrorPage from '../../pages/error';

enum Errors {
    None= '',
    NotEnabled= 'Chat is not enabled',
    NotLoggedIn= "Must be logged in to read chat"
}
interface IState {
    channels: {
        [category: string] : IChannel[]
    };
    loaded: boolean;
    error: Errors;
    channelToToggleTree: Function,
    categoryToToggleTree: Function,
    menu_toggle_tree: ToggleTree,
    adminModals: { [modal: string]: boolean },
    adminCategory: string,
    adminChannel: IChannel | {},
    onincomingmessage: (any: any) => void
}

function setToggleTree(path: string, toggle: boolean) {
    let current_tree = JSON.parse(localStorage[`${app.activeChainId()}-chat-toggle-tree`]);
    const split = path.split('.');
    for (const field of split.slice(0, split.length-1)) {
        if (current_tree.hasOwnProperty(field)) {
            current_tree = current_tree[field];
        } else {
            return;
        }
    }
    current_tree[split[split.length-1]] = toggle;
    const new_tree = current_tree;
    localStorage[`${app.activeChainId()}-chat-toggle-tree`] = JSON.stringify(new_tree);
}

export const ChatSection: m.Component<{channels: IChannel[], activeChannel: string}, IState> = {
    oninit: async (vnode) => {
        vnode.state.loaded = false;

        if(_.isEmpty(vnode.attrs.channels)){
            await app.socket.chatNs.reinit()
            vnode.attrs.channels = Object.values(app.socket.chatNs.channels)
        }

        vnode.state.channelToToggleTree = (channels: IChannel[]) => {
            const toggle_tree = {}
            channels.forEach(k => {toggle_tree[k.name] = {toggled_state: false}})
            return toggle_tree
        }

        vnode.state.categoryToToggleTree = (categories: string[], default_state: boolean) => {
            const toggle_tree = {}
            categories.forEach(category => {
                const channelToggleTree = vnode.state.channelToToggleTree(vnode.state.channels[category])
                toggle_tree[category] = {
                    toggled_state: default_state,
                    children: channelToggleTree
                }
            })
            return toggle_tree
        }

        vnode.state.adminModals = {
            'CreateCategory': false,
            'CreateChannel': false,
            'RenameCategory': false,
            'DeleteCategory': false,
            'RenameChannel': false,
            'DeleteChannel': false,
        }

        vnode.state.adminCategory = ""
        vnode.state.adminChannel = {}

        vnode.state.channels = {}
        vnode.attrs.channels.forEach(c => {
            const { ChatMessages, ...metadata } = c
            vnode.state.channels[metadata.category]
            ? vnode.state.channels[metadata.category].push(metadata)
            : vnode.state.channels[metadata.category] = [metadata]
        });

        vnode.state.onincomingmessage = (msg) => {
            if(vnode.attrs.activeChannel) app.socket.chatNs.readMessages(vnode.attrs.activeChannel)
            if(msg.chat_channel_id === vnode.attrs.activeChannel){
                vnode.attrs.channels.find(c => c.id === msg.chat_channel_id).unread = 0;
            }
            m.redraw.sync()
        }
        app.socket.chatNs.addListener(WebsocketMessageNames.ChatMessage, vnode.state.onincomingmessage.bind(vnode));
        vnode.state.loaded = true;

        vnode.state.menu_toggle_tree = { // Used to track admin menu render status for hover
            toggled_state: false,
            children: vnode.state.categoryToToggleTree(Object.keys(vnode.state.channels), false)
        }
    },
    onbeforeupdate: (vnode, old) => {
        if(!_.isEqual(vnode.attrs.channels, old.attrs.channels)) {
            vnode.attrs.channels.forEach(c => {
                const { ChatMessages, ...metadata } = c
                vnode.state.channels[metadata.category]
                ? vnode.state.channels[metadata.category].push(metadata)
                : vnode.state.channels[metadata.category] = [metadata]
            });
            vnode.state.menu_toggle_tree = {
                toggled_state: false,
                children: vnode.state.categoryToToggleTree(Object.keys(vnode.state.channels), false)
            }
        }
    },
    onremove: (vnode) => {
        if(app.socket){
            app.socket.chatNs.removeListener(WebsocketMessageNames.ChatMessage, vnode.state.onincomingmessage)
        }
    },
    view: (vnode) => {
        if(!app.socket) return <div>No</div>;
        if(!vnode.state.loaded) return <Spinner></Spinner>
        vnode.state.channels = {}
        vnode.attrs.channels.forEach(c => {
            const { ChatMessages, ...metadata } = c
            vnode.state.channels[metadata.category]
            ? vnode.state.channels[metadata.category].push(metadata)
            : vnode.state.channels[metadata.category] = [metadata]
        });

        const channel_toggle_tree: ToggleTree = {
            toggled_state: true,
            children: vnode.state.categoryToToggleTree(Object.keys(vnode.state.channels),true)
        }

        // Check if an existing toggle tree is stored
        if (!localStorage[`${app.activeChainId()}-chat-toggle-tree`]) {
            console.log("setting toggle tree from scratch")
            localStorage[`${app.activeChainId()}-chat-toggle-tree`] = JSON.stringify(channel_toggle_tree);
        } else if (!verifyCachedToggleTree('chat', channel_toggle_tree)) {
            console.log("setting chat toggle tree since the cached version differs from the updated version")
            localStorage[`${app.activeChainId()}-chat-toggle-tree`] = JSON.stringify(channel_toggle_tree);
        }
        const toggle_tree_state = JSON.parse(localStorage[`${app.activeChainId()}-chat-toggle-tree`]);

        // ---------- Build Section Props ---------- //

        const sectionAdminButton: m.Component<{},{}> = {
            view: () => {
                return <div>
                    <Icon
                        name={Icons.PLUS_CIRCLE}
                        onclick={(e) => {
                            e.stopPropagation();
                            vnode.state.adminModals['CreateCategory'] = true
                        }}>
                    </Icon>
                </div>
            },
        }

        const categoryAdminButton = (category: string): m.Component<{},{}> => {
            return {
                view: () => {
                    const handleMouseout = () => {
                        if(vnode.state.menu_toggle_tree['children'][category]['toggled_state']) {
                            vnode.state.menu_toggle_tree['children'][category]['toggled_state'] = false;
                        }
                    }

                    const handleMouseover = (e) => {
                        if(!vnode.state.menu_toggle_tree['children'][category]['toggled_state']) {
                            vnode.state.menu_toggle_tree['children'][category]['toggled_state'] = true;
                            vnode.state.adminCategory = category
                        } else {
                            e.redraw = false;
                            e.stopPropagation();
                        }
                    }

                    const handleMenuClick = (e, modal_name) => {
                        e.stopPropagation();
                        vnode.state.adminModals[modal_name] = true;
                        handleMouseout();
                    }

                    const menu_component = <Menu
                      class="admin-menu"
                      onmouseenter={handleMouseover}
                      onmouseleave={handleMouseout}
                    >
                            <MenuItem iconLeft={Icons.PLUS_CIRCLE} label="Add Channel"
                              onclick={e => {handleMenuClick(e, 'CreateChannel')}}/>
                            <MenuItem iconLeft={Icons.EDIT_2} label="Rename Category"
                              onclick={e => {handleMenuClick(e, 'RenameCategory')}}/>
                            <MenuItem iconLeft={Icons.DELETE} label="Delete Category"
                              onclick={e => {handleMenuClick(e, 'DeleteCategory')}}/>
                    </Menu>

                    return <div>
                    <Icon name={Icons.EDIT} onmouseenter={handleMouseover} onmouseleave={handleMouseout} />
                    {vnode.state.menu_toggle_tree['children'][category]['toggled_state'] && menu_component}
                    </div>
                },
            }
        }

        const channelRightIcon = (channel: IChannel): m.Component<{},{}>  => {
            const handleMouseout = () => {
                if(vnode.state.menu_toggle_tree['children'][channel.category]['children'][channel.name]['toggled_state']) {
                    vnode.state.menu_toggle_tree['children'][channel.category]['children'][channel.name]['toggled_state'] = false;
                }
            }

            const handleMouseover = (e) => {
                if(!vnode.state.menu_toggle_tree['children'][channel.category]['children'][channel.name]['toggled_state']) {
                    vnode.state.menu_toggle_tree['children'][channel.category]['children'][channel.name]['toggled_state'] = true;
                    vnode.state.adminChannel = channel;
                } else {
                    e.redraw = false;
                    e.stopPropagation();
                }
            }

            const handleMenuClick = (e, modal_name) => {
                e.stopPropagation();
                vnode.state.adminModals[modal_name] = true;
                handleMouseout()
            }

            const menu_component = <Menu
              class="admin-menu"
              onmouseenter={handleMouseover}
              onmouseleave={handleMouseout}
            >
                <MenuItem iconLeft={Icons.EDIT_2} label="Rename Channel"
                    onclick={e => {handleMenuClick(e, 'RenameChannel');}}/>
                <MenuItem iconLeft={Icons.DELETE} label="Delete Channel"
                    onclick={e => {handleMenuClick(e, 'DeleteChannel');}}/>
            </Menu>
            return {
                view: () => {
                    return <div>
                    {channel.unread > 0 && <div class="unread_icon"><p>{channel.unread}</p></div>}
                    <Icon name={Icons.EDIT} onmouseenter={handleMouseover} onmouseleave={handleMouseout}></Icon>
                    {vnode.state.menu_toggle_tree['children'][channel.category]['children'][channel.name]['toggled_state'] &&
                      menu_component}
                    </div>
                }
            }
        }

        const channelToSubSectionProps = (channel: IChannel): SubSectionProps => {
            const onChannelPage = (p) => p.startsWith(`/${app.activeChainId()}/chat/${channel.id}`) ||
              (app.isCustomDomain() && p.startsWith(`/chat/${channel.id}`));
            return {
                title: channel.name,
                row_icon: true,
                is_visible: true,
                is_active: onChannelPage(m.route.get()),
                is_updated: channel.unread > 0,
                onclick: (e) => {
                    navigateToSubpage(`/chat/${channel.id}`);
                },
                right_icon: channelRightIcon(channel)
            }
        }

        const categoryToSectionGroup = (category: string): SectionGroupProps => {
            return {
                title: category,
                contains_children: true,
                default_toggle: toggle_tree_state['children'][category]['toggled_state'],
                is_visible: true,
                is_active: false, // TODO: if any child is active
                is_updated: false, // TODO: is collapsed and children has unread
                onclick: (e) => {e.preventDefault();},
                display_data: vnode.state.channels[category].map(channelToSubSectionProps),
                right_icon: categoryAdminButton(category)
            };
        }

        const channel_data: SectionGroupProps[] = Object.keys(vnode.state.channels).map(categoryToSectionGroup)

        const close_overlay = () => {
            Object.keys(vnode.state.adminModals).forEach(k => {
                vnode.state.adminModals[k] = false;
            })
            m.redraw()
        }
        const overlay_content: m.Vnode = vnode.state.adminModals['CreateCategory']
          ? <CreateCategory handleClose={close_overlay}/>
          : vnode.state.adminModals['CreateChannel']
          ? <CreateChannel handleClose={close_overlay} category={vnode.state.adminCategory} />
          : vnode.state.adminModals['RenameCategory']
          ? <RenameCategory handleClose={close_overlay} category={vnode.state.adminCategory} />
          : vnode.state.adminModals['RenameChannel']
          ? <RenameChannel handleClose={close_overlay} channel={vnode.state.adminChannel}/>
          : vnode.state.adminModals['DeleteCategory']
          ? <DeleteCategory handleClose={close_overlay} category={vnode.state.adminCategory} />
          : vnode.state.adminModals['DeleteChannel']
          ? <DeleteChannel handleClose={close_overlay} channel={vnode.state.adminChannel} />
          : <div></div>

        const sidebar_section_data: SidebarSectionProps = {
            title: 'CHAT',
            default_toggle: toggle_tree_state['toggled_state'],
            onclick: (e, toggle: boolean) => {
                e.preventDefault();
                setToggleTree('toggled_state', toggle);
            },
            display_data: channel_data,
            is_active: false,
            right_icon: sectionAdminButton,
            extra_components: <Overlay
                class='chatAdminOverlay'
                isOpen={Object.values(vnode.state.adminModals).some(Boolean)}
                onClose={close_overlay}
                closeOnOutsideClick={true}
                content={overlay_content}
            />
        }

        return m(SidebarSection, {...sidebar_section_data})
    }
}
