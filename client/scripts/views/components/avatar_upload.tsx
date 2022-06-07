/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import Dropzone from 'dropzone';

import 'components/avatar_upload.scss';

import app from 'state';
import { CWIconButton } from './component_kit/cw_icon_button';
import { getClasses } from './component_kit/helpers';

type AvatarUploadAttrs = {
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
      clickable: '.AvatarUpload .dropzone-attach .IconButton',
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
        $.post(`${app.serverUrl()}/getUploadSignature`, {
          name: file.name, // imageName.png
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

  view() {
    const logoURL = this.dropzone?.option?.url || app.chain?.meta.iconUrl;

    return (
      <form class="AvatarUpload">
        {!this.uploaded && (
          <>
            <CWIconButton
              iconButtonTheme="primary"
              iconName="plusCircle"
              iconSize="small"
            />
            <div
              class="dropzone-attach"
              style={`background-image: url(${logoURL}); background-size: 92px;`}
            />
          </>
        )}
        <div class="dropzone-previews" />
      </form>
    );
  }
}
