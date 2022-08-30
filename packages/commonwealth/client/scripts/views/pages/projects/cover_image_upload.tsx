/* @jsx m */
import 'pages/projects/cover_image_upload.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import Dropzone from 'dropzone';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { ICreateProjectForm } from './create_project_form';

interface ICoverImageUploadAttrs {
  form: ICreateProjectForm;
  uploadStartedCallback?: CallableFunction;
  uploadCompleteCallback?: CallableFunction;
}

// TODO Graham 6/21/22: Consider syncing down the line w/ new Avatar upload
export default class CoverImageUpload
  implements m.ClassComponent<ICoverImageUploadAttrs>
{
  private dropzone?: any;
  private uploading: boolean;
  private uploaded: boolean;

  oncreate(vnode: m.VnodeDOM<ICoverImageUploadAttrs>) {
    $(vnode.dom).on('cleardropzone', () => {
      this.dropzone.files.map((file) => this.dropzone.removeFile(file));
    });
    this.dropzone = new Dropzone(vnode.dom, {
      // configuration for textarea dropzone
      clickable: '.CoverImageUpload .attach-button',
      previewsContainer: '.CoverImageUpload .dropzone-previews',
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
        $.post(`${app.serverUrl()}/getUploadSignature`, {
          name: file.name,
          mimetype: file.type,
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
      this.uploading = true;
      this.dropzone.options.url = file.uploadURL;
      if (vnode.attrs.uploadStartedCallback) {
        vnode.attrs.uploadStartedCallback();
      }
    });
    this.dropzone.on('complete', (file) => {
      if (vnode.attrs.uploadCompleteCallback) {
        vnode.attrs.uploadCompleteCallback(this.dropzone.files);
      }
    });
  }

  view(vnode: m.Vnode<ICoverImageUploadAttrs>) {
    const logoURL = this.dropzone?.options?.url;
    return (
      <div class="CoverImageUpload">
        <div
          class={`dropzone-attach ${this.uploaded ? 'hidden' : ''}`}
          style={`background-image: url(${logoURL}); background-size: 92px;`}
        >
          <div class="attach-button">
            <CWIcon iconName="plus" iconSize="large" />
            <CWText type="h5">Upload Cover Image</CWText>
            <CWText type="caption">1040px by 568px</CWText>
          </div>
        </div>
        <div class={`dropzone-previews`}></div>
      </div>
    );
  }
}
