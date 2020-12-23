import 'components/avatar_upload.scss';

import $ from 'jquery';
import m from 'mithril';
import Dropzone from 'dropzone';

import User from 'views/components/widgets/user';
import { featherIcon } from 'helpers';
import app from 'state';

interface IAttrs {
  uploadStartedCallback?: CallableFunction;
  uploadCompleteCallback?: CallableFunction;
}

interface IState {
  dropzone?: any;
  uploaded: boolean;
}

const AvatarUpload: m.Component<IAttrs, IState> = {
  oncreate: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    $(vnode.dom).on('cleardropzone', () => {
      vnode.state.dropzone.files.map((file) => vnode.state.dropzone.removeFile(file));
    });
    vnode.state.dropzone = new Dropzone(vnode.dom, {
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
        }).then((response) => {
          if (response.status !== 'Success') {
            return done('Failed to get an S3 signed upload URL', response.error);
          }
          file.uploadURL = response.result;
          vnode.state.uploaded = true;
          done();
          setTimeout(() => vnode.state.dropzone.processFile(file));
        }).catch((err : any) => {
          done('Failed to get an S3 signed upload URL',
            err.responseJSON ? err.responseJSON.error : err.responseText);
        });
      },
      sending: (file, xhr) => {
        const _send = xhr.send;
        xhr.send = () => { _send.call(xhr, file); };
      },
    });
    vnode.state.dropzone.on('processing', (file) => {
      vnode.state.dropzone.options.url = file.uploadURL;
      if (vnode.attrs.uploadStartedCallback) {
        vnode.attrs.uploadStartedCallback();
      }
    });
    vnode.state.dropzone.on('complete', (file) => {
      if (vnode.attrs.uploadCompleteCallback) {
        vnode.attrs.uploadCompleteCallback(vnode.state.dropzone.files);
      }
    });
  },
  view: (vnode) => {
    return m('form.AvatarUpload', [
      m('.dropzone-attach', {
        class: (vnode.state.uploaded) ? 'hidden' : ''
      }, [
        m('div.attach-button', [
          m('span.icon-plus')
        ])
      ]),
      !vnode.state.uploaded && m(User, {
        user: app.user.activeAccount,
        avatarOnly: true,
        avatarSize: 100,
      }),
      m('.dropzone-previews', {
        class: (vnode.state.uploaded) ? '' : 'hidden'
      }),
    ]);
  }
};

export default AvatarUpload;
