/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import Dropzone from 'dropzone';

import 'components/avatar_upload.scss';

import app from 'state';
import User from 'views/components/widgets/user';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

type AvatarScope = 'account' | 'chain' | 'community';

type AvatarUploadAttrs = {
  avatarScope: AvatarScope;
  uploadCompleteCallback?: CallableFunction;
  uploadStartedCallback?: CallableFunction;
};

export class AvatarUpload implements m.ClassComponent<AvatarUploadAttrs> {
  private dropzone?: any;
  private uploaded: boolean;

  oncreate(vnode) {
    $(vnode.dom).on('cleardropzone', () => {
      this.dropzone.files.map((file) => this.dropzone.removeFile(file));
    });

    this.dropzone = new Dropzone(vnode.dom, {
      // configuration for textarea dropzone
      clickable: '.AvatarUpload .attach-button',
      previewsContainer: '.AvatarUpload .dropzone-previews',
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
        // TODO: Change to POST /uploadSignature
        // TODO: Reuse code as this is used in other places
        $.post(`${app.serverUrl()}/getUploadSignature`, {
          name: file.name, // tokyo.png
          mimetype: file.type, // image/png
          auth: true,
          jwt: app.user.jwt,
        })
          .then((response) => {
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

  view(vnode) {
    const logoURL = this.dropzone?.option?.url || app.chain?.meta.iconUrl;

    return m('form.AvatarUpload', [
      m(
        '.dropzone-attach',
        {
          class: this.uploaded ? 'hidden' : '',
          style:
            vnode.attrs.avatarScope === 'chain' ||
            vnode.attrs.avatarScope === 'community'
              ? `background-image: url(${logoURL}); background-size: 92px;`
              : '',
        },
        [
          m('div.attach-button', [
            m(CWIcon, { iconName: 'plus', iconSize: 'small' }),
          ]),
        ]
      ),
      !this.uploaded &&
        vnode.attrs.avatarScope === 'account' &&
        m(User, {
          user: app.user.activeAccount,
          avatarOnly: true,
          avatarSize: 100,
        }),
      m('.dropzone-previews', {
        class: this.uploaded ? '' : 'hidden',
      }),
    ]);
  }
}
