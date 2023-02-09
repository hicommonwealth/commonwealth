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
  } from 'mithrilInterop';

import 'components/avatar_upload.scss';
import Dropzone from 'dropzone';
import { isUndefined } from 'helpers/typeGuards';
import $ from 'jquery';
import type { Account } from 'models';

import app from 'state';
import { CWIconButton } from './component_kit/cw_icon_button';
import { getClasses } from './component_kit/helpers';
import { ComponentType } from './component_kit/types';

type AvatarUploadStyleAttrs = {
  size?: 'small' | 'large';
};

type AvatarUploadAttrs = {
  account?: Account;
  darkMode?: boolean;
  scope: 'community' | 'user';
  uploadCompleteCallback?: CallableFunction;
  uploadStartedCallback?: CallableFunction;
} & AvatarUploadStyleAttrs;

export class AvatarUpload extends ClassComponent<AvatarUploadAttrs> {
  private dropzone?: any;
  private uploaded: boolean;

  oncreate(vnode: ResultNode<AvatarUploadAttrs>) {
    // TODO: @ZAK @REACT
    $(vnode.dom).on('cleardropzone', () => {
      this.dropzone.files.map((file) => this.dropzone.removeFile(file));
    });
    // TODO: @ZAK @REACT
    this.dropzone = new Dropzone(vnode.dom, {
      clickable: '.icon-button-container',
      previewsContainer: '.AvatarUpload .dropzone-preview-container',
      // configuration for direct upload to s3
      url: '/', // overwritten when we get the target URL back from s3
      header: '',
      method: 'put',
      parallelUploads: 1,
      uploadMultiple: false,
      autoProcessQueue: false,
      maxFiles: 1,
      maxFilesize: 10, // MB
      // request a signed upload URL when a file is accepted from the user
      accept: (file, done) => {
        $.post(`${app.serverUrl()}/getUploadSignature`, {
          name: file.name, // imageName.png
          mimetype: file.type, // image/png
          auth: true,
          jwt: app.user.jwt,
        })
          .then((response) => {
            console.log(response);
            if (response.status !== 'Success') {
              return done(
                'Failed to get an S3 signed upload URL',
                response.error
              );
            }
            file.uploadURL = response.result;
            this.uploaded = true;
            done();
            setTimeout(() => this.dropzone.processFile(file));
          })
          .catch((err: any) => {
            done(
              'Failed to get an S3 signed upload URL',
              err.responseJSON ? err.responseJSON.error : err.responseText
            );
          });
      },
      sending: (file, xhr) => {
        const _send = xhr.send;
        xhr.send = () => {
          _send.call(xhr, file);
        };
      },
    });

    this.dropzone.on('processing', (file) => {
      this.dropzone.options.url = file.uploadURL;
      if (vnode.attrs.uploadStartedCallback) {
        vnode.attrs.uploadStartedCallback();
      }
    });

    this.dropzone.on('complete', () => {
      if (vnode.attrs.uploadCompleteCallback) {
        vnode.attrs.uploadCompleteCallback(this.dropzone.files);
      }
    });
  }

  view(vnode: ResultNode<AvatarUploadAttrs>) {
    const { account, darkMode, scope, size = 'small' } = vnode.attrs;

    const avatarSize = size === 'small' ? 60 : 108;
    const forUser = scope === 'user';
    const forCommunity = scope === 'community';

    const avatar = forUser
      ? account?.profile?.getAvatar(avatarSize)
      : forCommunity
      ? app.chain?.meta.getAvatar(avatarSize)
      : undefined;

    const localUploadURL = this.dropzone?.option?.url;

    return (
      <div
        className={getClasses<AvatarUploadStyleAttrs>(
          { size },
          ComponentType.AvatarUpload
        )}
      >
        <div
          className={getClasses<{ darkMode?: boolean }>(
            { darkMode },
            'icon-button-container'
          )}
        >
          <CWIconButton
            iconButtonTheme="primary"
            iconName="plusCircle"
            iconSize={size === 'small' ? 'small' : 'medium'}
          />
        </div>
        {!this.uploaded && (
          <div
            className={getClasses<{ hasNoAvatar: boolean }>(
              { hasNoAvatar: isUndefined(avatar) },
              'dropzone-attach'
            )}
          >
            {avatar}
          </div>
        )}
        <div
          className={getClasses<{ hidden: boolean }>(
            { hidden: !this.uploaded },
            'dropzone-preview-container'
          )}
          style={{
            backgroundImage: `url(${localUploadURL})`,
            backgroundSize: `${avatarSize}px;`,
          }}
        />
      </div>
    );
  }
}
