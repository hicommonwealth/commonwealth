/* eslint-disable max-classes-per-file */
/* @jsx jsx */
import React from 'react';

import { ClassComponent, ResultNode, jsx } from 'mithrilInterop';

import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

import app from 'state';
import { CWButton } from '../component_kit/cw_button';
import { CWCard } from '../component_kit/cw_card';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { CWTextInput } from '../component_kit/cw_text_input';
import { IChannel } from 'controllers/server/socket/chatNs';
import { MixpanelChatEvents } from 'analytics/types';

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
        <div className="header">
          <CWText type="h5">Create Category</CWText>
          <CWIcon iconName="close" onClick={vnode.attrs.handleClose} />
        </div>
        <CWText>A new category will be added to chat.</CWText>
        <CWTextInput
          label="*Category Title"
          placeholder="Enter a category title"
          onInput={handleCategoryChange}
        />
        <CWTextInput
          label="*Channel Title"
          placeholder="Enter a channel title"
          onInput={handleChannelChange}
        />
        <div className="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onClick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-blue"
            disabled={!this.category.length || !this.channel.length}
            label="Submit"
            onClick={handleSubmit}
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
        <div className="header">
          <CWText type="h5">Create Channel</CWText>
          <CWIcon iconName="close" onClick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          A new channel will be added to the <b>{vnode.attrs.category}</b>{' '}
          category. Upon submitting, refresh the browser window!
        </CWText>
        <CWTextInput
          label="*Channel Title"
          placeholder="Enter a channel title"
          onInput={handleChannelChange}
        />
        <div className="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onClick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-blue"
            disabled={!this.channel.length}
            label="Submit"
            onClick={handleSubmit}
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
        <div className="header">
          <CWText type="h5">Rename Channel</CWText>
          <CWIcon iconName="close" onClick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          Give a new name to <b>{vnode.attrs.channel.name}</b>
        </CWText>
        <CWTextInput
          label="*Channel Name"
          placeholder="Enter a new channel name"
          onInput={handleChange}
        />
        <div className="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onClick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-blue"
            disabled={!this.channelName.length}
            label="Submit"
            onClick={handleSubmit}
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
        <div className="header">
          <CWText type="h5">Rename Category</CWText>
          <CWIcon iconName="close" onClick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          Give a new name to <b>{vnode.attrs.category}</b>
        </CWText>
        <CWTextInput
          label="*Category Name"
          placeholder="Enter a category name"
          onInput={handleChange}
        />
        <div className="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onClick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-blue"
            disabled={!this.newCategory.length}
            label="Submit"
            onClick={handleSubmit}
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
        <div className="header">
          <CWText type="h5">Delete Channel</CWText>
          <CWIcon iconName="close" onClick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          The <b>{vnode.attrs.channel.name} </b> channel will be deleted.
          <b> All messages within will be lost forever.</b> Ok?
        </CWText>
        <div className="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onClick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-red"
            label="Yes, Delete"
            onClick={handleSubmit}
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
        <div className="header">
          <CWText type="h5">Delete Category</CWText>
          <CWIcon iconName="close" onClick={vnode.attrs.handleClose} />
        </div>
        <CWText>
          Deleting the <b>{vnode.attrs.category}</b> category will delete all
          channels inside.
          <b> All messages inside all the channels will be lost forever.</b> Ok?
        </CWText>
        <div className="button-bar">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onClick={vnode.attrs.handleClose}
          />
          <CWButton
            buttonType="primary-red"
            label="Yes, Delete"
            onClick={handleSubmit}
          />
        </div>
      </CWCard>
    );
  }
}
