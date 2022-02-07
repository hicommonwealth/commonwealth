/* @jsx m */

import m from 'mithril';
import app from 'state';
import { Icon, Icons, Size } from 'construct-ui';
import { CWCard } from '../component_kit/cw_card';
import { CWButton } from '../component_kit/cw_button'
import { CWTextInput } from '../component_kit/cw_text_input';
import { channel } from './chat_section';

export const CreateCategory: m.Component<{handleClose: Function},{category: string, channel: string}> = {
    oninit: (vnode) => {
        vnode.state.category = ""
        vnode.state.channel = ""
    },
    view: (vnode) => {
        const handleSubmit = async () => {
            await app.socket.chatNs.createChatChannel(vnode.state.channel, app.activeChainId(), vnode.state.category)
            vnode.attrs.handleClose()
        }

        const handleCategoryChange = evt => {vnode.state.category = evt.target.value}
        const handleChannelChange = evt => {vnode.state.channel = evt.target.value}

        return <CWCard elevation='elevation-1' interactive={false}>
                <Icon name={Icons.X} size={Size.XL} onclick={vnode.attrs.handleClose}></Icon>
                <h2>Create a Category</h2>
                <h4>A new category will be added to chat. <br /><br /></h4>
                <CWTextInput
                  label="*Category Title"
                  placeholder="Enter a category title"
                  oninput={handleCategoryChange}
                />
                <CWTextInput
                  label="*Channel Title"
                  placeholder="Enter a channel title"
                  oninput={handleChannelChange}
                />
                <div class="button-bar">
                    <CWButton buttonType='secondary' label="Cancel" onclick={vnode.attrs.handleClose} />
                    <CWButton disabled={!vnode.state.category.length || !vnode.state.channel.length}
                      label="Submit" onclick={handleSubmit} />
                </div>

        </CWCard>
    }
}

export const CreateChannel: m.Component<{handleClose: Function, category: string},{channel: string}> = {
    oninit: (vnode) => {
        vnode.state.channel = ""
    },
    view: (vnode) => {
        const handleSubmit = async () => {
            await app.socket.chatNs.createChatChannel(vnode.state.channel, app.activeChainId(), vnode.attrs.category)
            vnode.attrs.handleClose()
        }

        const handleChannelChange = evt => {vnode.state.channel = evt.target.value}

        return <CWCard elevation='elevation-1' interactive={false}>
                <Icon name={Icons.X} size={Size.XL} onclick={vnode.attrs.handleClose}></Icon>
                <h2>Create a Channel</h2>
                <h4>A new channel will be added to the <b>{vnode.attrs.category}</b> category <br /><br /></h4>
                <CWTextInput
                  label="*Channel Title"
                  placeholder="Enter a channel title"
                  oninput={handleChannelChange}
                />
                <div class="button-bar">
                    <CWButton buttonType='secondary' label="Cancel" onclick={vnode.attrs.handleClose} />
                    <CWButton disabled={!vnode.state.channel.length}
                      label="Submit" onclick={handleSubmit} />
                </div>

        </CWCard>
    }
}

export const RenameChannel: m.Component<{handleClose: Function, channel: channel},{channel_name: string}> = {
    oninit: (vnode) => {
        vnode.state.channel_name = ""
    },
    view: (vnode) => {
        const handleSubmit = async () => {
            await app.socket.chatNs.renameChatChannel(vnode.attrs.channel.id, vnode.state.channel_name)
            vnode.attrs.handleClose()
        }

        const handleChange = evt => {vnode.state.channel_name = evt.target.value}

        return <CWCard elevation='elevation-1' interactive={false}>
                <Icon name={Icons.X} size={Size.XL} onclick={vnode.attrs.handleClose}></Icon>
                <h2>Rename Channel</h2>
                <h4>Give a new name to <b>{vnode.attrs.channel.name}</b> <br /><br /></h4>
                <CWTextInput
                  label="*Channel Name"
                  placeholder="Enter a new channel name"
                  oninput={handleChange}
                />
                <div class="button-bar">
                    <CWButton buttonType='secondary' label="Cancel" onclick={vnode.attrs.handleClose} />
                    <CWButton disabled={!vnode.state.channel_name.length}
                      label="Submit" onclick={handleSubmit} />
                </div>

        </CWCard>
    }
}

export const RenameCategory: m.Component<{handleClose: Function, category: string},{new_category: string}> = {
    oninit: (vnode) => {
        vnode.state.new_category = ""
    },
    view: (vnode) => {
        const handleSubmit = async () => {
            await app.socket.chatNs.renameChatCategory(vnode.attrs.category, vnode.state.new_category)
            vnode.attrs.handleClose()
        }

        const handleChange = evt => {vnode.state.new_category = evt.target.value}

        return <CWCard elevation='elevation-1' interactive={false}>
                <Icon name={Icons.X} size={Size.XL} onclick={vnode.attrs.handleClose}></Icon>
                <h2>Rename Category</h2>
                <h4>Give a new name to <b>{vnode.attrs.category}</b> <br /><br /></h4>
                <CWTextInput
                  label="*Category Name"
                  placeholder="Enter a category name"
                  oninput={handleChange}
                />
                <div class="button-bar">
                    <CWButton buttonType='secondary' label="Cancel" onclick={vnode.attrs.handleClose} />
                    <CWButton disabled={!vnode.state.new_category.length}
                      label="Submit" onclick={handleSubmit} />
                </div>

        </CWCard>
    }
}

export const DeleteChannel: m.Component<{handleClose: Function, channel: channel},{}> = {
    view: (vnode) => {
        const handleSubmit = async () => {
            await app.socket.chatNs.deleteChatChannel(vnode.attrs.channel.id)
            vnode.attrs.handleClose()
        }

        return <CWCard className="danger" elevation='elevation-1' interactive={false}>
                <Icon name={Icons.X} size={Size.XL} onclick={vnode.attrs.handleClose}></Icon>
                <h2>Delete Channel</h2>
                <h4>The <b>{vnode.attrs.channel.name} </b> channel will be deleted.
                  <b> All messages within will be lost forever.</b> Ok?<br /><br /></h4>
                <div class="button-bar">
                    <CWButton buttonType='secondary' label="Cancel" onclick={vnode.attrs.handleClose} />
                    <CWButton className="danger" label="Yes, Delete" onclick={handleSubmit} />
                </div>

        </CWCard>
    }
}

export const DeleteCategory: m.Component<{handleClose: Function, category: string},{}> = {
    view: (vnode) => {
        const handleSubmit = async () => {
            await app.socket.chatNs.deleteChatCategory(vnode.attrs.category)
            vnode.attrs.handleClose()
        }

        return <CWCard className="danger" elevation='elevation-1' interactive={false}>
                <Icon name={Icons.X} size={Size.XL} onclick={vnode.attrs.handleClose}></Icon>
                <h2>Delete Category</h2>
                <h4>Deleting the <b>{vnode.attrs.category}</b> category will delete all channels inside.
                  <b> All messages inside all the channels will be lost forever.</b> Ok?<br /><br /></h4>
                <div class="button-bar">
                    <CWButton buttonType='secondary' label="Cancel" onclick={vnode.attrs.handleClose} />
                    <CWButton className="danger" label="Yes, Delete" onclick={handleSubmit} />
                </div>

        </CWCard>
    }
}