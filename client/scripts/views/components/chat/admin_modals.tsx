/* @jsx m */

import m from 'mithril';
import app from 'state';
import { Icon, Icons, Size } from 'construct-ui';
import { ButtonType } from '../component_kit/types';
import { CWCard } from '../component_kit/cw_card';
import { CWButton } from '../component_kit/cw_button'
import { CWTextInput } from '../component_kit/cw_text_input';


// Create Category

// Create Channel inside Category
// Rename Category
// Delete Category

// Rename Channel
// Delete Channel

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