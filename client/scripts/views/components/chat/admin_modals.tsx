/* eslint-disable max-classes-per-file */
/* @jsx m */

import m from 'mithril';
import app from 'state';
import { Icon, Icons, Size } from 'construct-ui';
import { IChannel } from 'client/scripts/controllers/server/socket/chatNs';
import { CWCard } from '../component_kit/cw_card';
import { CWButton } from '../component_kit/cw_button';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

export class CreateCategory
  implements m.ClassComponent<{ handleClose: Function }>
{
  category: string;
  channel: string;

  oninit() {
    this.category = '';
    this.channel = '';
  }

  view(vnode) {
    const handleSubmit = async () => {
      await app.socket.chatNs.createChatChannel(
        this.channel,
        app.activeChainId(),
        this.category
      );
      vnode.attrs.handleClose();
    };

    const handleCategoryChange = (evt) => {
      this.category = evt.target.value;
    };
    const handleChannelChange = (evt) => {
      this.channel = evt.target.value;
    };

    return (
      <CWCard elevation="elevation-1" interactive={false}>
        <div class="header">
          <h3>Create Category</h3>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <h4>A new category will be added to chat.</h4>
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
          <CWButton
            buttonType="secondary"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            disabled={!this.category.length || !this.channel.length}
            label="Submit"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class CreateChannel
  implements m.ClassComponent<{ handleClose: Function; category: string }>
{
  channel: string;
  oninit() {
    this.channel = '';
  }
  view(vnode) {
    const handleSubmit = async () => {
      await app.socket.chatNs.createChatChannel(
        this.channel,
        app.activeChainId(),
        vnode.attrs.category
      );
      vnode.attrs.handleClose();
    };

    const handleChannelChange = (evt) => {
      this.channel = evt.target.value;
    };

    return (
      <CWCard elevation="elevation-1" interactive={false}>
        <div class="header">
          <h3>Create Channel</h3>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <h4>
          A new channel will be added to the <b>{vnode.attrs.category}</b>{' '}
          category
        </h4>
        <CWTextInput
          label="*Channel Title"
          placeholder="Enter a channel title"
          oninput={handleChannelChange}
        />
        <div class="button-bar">
          <CWButton
            buttonType="secondary"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            disabled={!this.channel.length}
            label="Submit"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class RenameChannel
  implements m.ClassComponent<{ handleClose: Function; channel: IChannel }>
{
  channel_name: string;
  oninit() {
    this.channel_name = '';
  }
  view(vnode) {
    const handleSubmit = async () => {
      vnode.attrs.handleClose();
      await app.socket.chatNs.renameChatChannel(
        vnode.attrs.channel.id,
        this.channel_name
      );
    };

    const handleChange = (evt) => {
      this.channel_name = evt.target.value;
    };

    return (
      <CWCard elevation="elevation-1" interactive={false}>
        <div class="header">
          <h3>Rename Channel</h3>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <h4>
          Give a new name to <b>{vnode.attrs.channel.name}</b>
        </h4>
        <CWTextInput
          label="*Channel Name"
          placeholder="Enter a new channel name"
          oninput={handleChange}
        />
        <div class="button-bar">
          <CWButton
            buttonType="secondary"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            disabled={!this.channel_name.length}
            label="Submit"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class RenameCategory
  implements m.ClassComponent<{ handleClose: Function; category: string }>
{
  new_category: string;
  oninit() {
    this.new_category = '';
  }
  view(vnode) {
    const handleSubmit = async () => {
      await app.socket.chatNs.renameChatCategory(
        vnode.attrs.category,
        this.new_category
      );
      vnode.attrs.handleClose();
    };

    const handleChange = (evt) => {
      this.new_category = evt.target.value;
    };

    return (
      <CWCard elevation="elevation-1" interactive={false}>
        <div class="header">
          <h3>Rename Category</h3>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <h4>
          Give a new name to <b>{vnode.attrs.category}</b>
        </h4>
        <CWTextInput
          label="*Category Name"
          placeholder="Enter a category name"
          oninput={handleChange}
        />
        <div class="button-bar">
          <CWButton
            buttonType="secondary"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            disabled={!this.new_category.length}
            label="Submit"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class DeleteChannel
  implements m.ClassComponent<{ handleClose: Function; channel: IChannel }>
{
  view(vnode) {
    const handleSubmit = async () => {
      await app.socket.chatNs.deleteChatChannel(vnode.attrs.channel.id);
      vnode.attrs.handleClose();
    };

    return (
      <CWCard className="danger" elevation="elevation-1" interactive={false}>
        <div class="header">
          <h3>Delete Channel</h3>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <h4>
          The <b>{vnode.attrs.channel.name} </b> channel will be deleted.
          <b> All messages within will be lost forever.</b> Ok?
        </h4>
        <div class="button-bar">
          <CWButton
            buttonType="secondary"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            className="danger"
            label="Yes, Delete"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class DeleteCategory
  implements m.ClassComponent<{ handleClose: Function; category: string }>
{
  view(vnode) {
    const handleSubmit = async () => {
      await app.socket.chatNs.deleteChatCategory(vnode.attrs.category);
      vnode.attrs.handleClose();
    };

    return (
      <CWCard className="danger" elevation="elevation-1" interactive={false}>
        <div class="header">
          <h3>Delete Category</h3>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <h4>
          Deleting the <b>{vnode.attrs.category}</b> category will delete all
          channels inside.
          <b> All messages inside all the channels will be lost forever.</b> Ok?
        </h4>
        <div class="button-bar">
          <CWButton
            buttonType="secondary"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            className="danger"
            label="Yes, Delete"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}
