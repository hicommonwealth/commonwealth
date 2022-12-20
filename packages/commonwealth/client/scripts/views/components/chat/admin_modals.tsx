/* eslint-disable max-classes-per-file */
/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render } from 'mithrilInterop';

import app from 'state';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { MixpanelChatEvents } from 'analytics/types';
import { IChannel } from 'controllers/server/socket/chatNs';
import { CWCard } from '../component_kit/cw_card';
import { CWButton } from '../component_kit/cw_button';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';

type ChannelAttrs = {
  category?: string;
  channel?: IChannel | Record<string, never>;
  handleClose: () => void;
};

export class CreateCategory extends ClassComponent<ChannelAttrs> {
  category: string;
  channel: string;

  oninit() {
    this.category = '';
    this.channel = '';
  }

  view(vnode: ResultNode<ChannelAttrs>) {
    const handleSubmit = async () => {
      await app.socket.chatNs.createChatChannel(
        this.channel,
        app.activeChainId(),
        this.category
      );

      mixpanelBrowserTrack({
        event: MixpanelChatEvents.NEW_CHANNEL_CREATED,
        isCustomDomain: app.isCustomDomain(),
        community: app.activeChainId(),
      });

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
          <CWText type="h5">Create Category</CWText>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <CWText>A new category will be added to chat.</CWText>
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
            buttonType="secondary-black"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-blue"
            disabled={!this.category.length || !this.channel.length}
            label="Submit"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class CreateChannel extends ClassComponent<ChannelAttrs> {
  private channel: string;

  oninit() {
    this.channel = '';
  }

  view(vnode: ResultNode<ChannelAttrs>) {
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
          <CWText type="h5">Create Channel</CWText>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          A new channel will be added to the <b>{vnode.attrs.category}</b>{' '}
          category
        </CWText>
        <CWTextInput
          label="*Channel Title"
          placeholder="Enter a channel title"
          oninput={handleChannelChange}
        />
        <div class="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-blue"
            disabled={!this.channel.length}
            label="Submit"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class RenameChannel extends ClassComponent<ChannelAttrs> {
  private channelName: string;

  oninit() {
    this.channelName = '';
  }

  view(vnode: ResultNode<ChannelAttrs>) {
    const handleSubmit = async () => {
      vnode.attrs.handleClose();
      await app.socket.chatNs.editChatChannel(
        vnode.attrs.channel.id,
        this.channelName
      );
    };

    const handleChange = (evt) => {
      this.channelName = evt.target.value;
    };

    return (
      <CWCard elevation="elevation-1" interactive={false}>
        <div class="header">
          <CWText type="h5">Rename Channel</CWText>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          Give a new name to <b>{vnode.attrs.channel.name}</b>
        </CWText>
        <CWTextInput
          label="*Channel Name"
          placeholder="Enter a new channel name"
          oninput={handleChange}
        />
        <div class="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-blue"
            disabled={!this.channelName.length}
            label="Submit"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class RenameCategory extends ClassComponent<ChannelAttrs> {
  newCategory: string;

  oninit() {
    this.newCategory = '';
  }

  view(vnode: ResultNode<ChannelAttrs>) {
    const handleSubmit = async () => {
      await app.socket.chatNs.editChatCategory(
        vnode.attrs.category,
        this.newCategory
      );
      vnode.attrs.handleClose();
    };

    const handleChange = (evt) => {
      this.newCategory = evt.target.value;
    };

    return (
      <CWCard elevation="elevation-1" interactive={false}>
        <div class="header">
          <CWText type="h5">Rename Category</CWText>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          Give a new name to <b>{vnode.attrs.category}</b>
        </CWText>
        <CWTextInput
          label="*Category Name"
          placeholder="Enter a category name"
          oninput={handleChange}
        />
        <div class="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-blue"
            disabled={!this.newCategory.length}
            label="Submit"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class DeleteChannel extends ClassComponent<ChannelAttrs> {
  view(vnode: ResultNode<ChannelAttrs>) {
    const handleSubmit = async () => {
      await app.socket.chatNs.deleteChatChannel(vnode.attrs.channel.id);
      vnode.attrs.handleClose();
    };

    return (
      <CWCard elevation="elevation-1" interactive={false}>
        <div class="header">
          <CWText type="h5">Delete Channel</CWText>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          The <b>{vnode.attrs.channel.name} </b> channel will be deleted.
          <b> All messages within will be lost forever.</b> Ok?
        </CWText>
        <div class="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-red"
            label="Yes, Delete"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}

export class DeleteCategory extends ClassComponent<ChannelAttrs> {
  view(vnode: ResultNode<ChannelAttrs>) {
    const handleSubmit = async () => {
      await app.socket.chatNs.deleteChatCategory(vnode.attrs.category);
      vnode.attrs.handleClose();
    };

    return (
      <CWCard elevation="elevation-1" interactive={false}>
        <div class="header">
          <CWText type="h5">Delete Category</CWText>
          <CWIcon iconName="close" onclick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          Deleting the <b>{vnode.attrs.category}</b> category will delete all
          channels inside.
          <b> All messages inside all the channels will be lost forever.</b> Ok?
        </CWText>
        <div class="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onclick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-red"
            label="Yes, Delete"
            onclick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}
