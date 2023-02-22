import React from 'react';

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

type AvatarUploadProps = {
  account?: Account;
  darkMode?: boolean;
  scope: 'community' | 'user';
  uploadCompleteCallback?: CallableFunction;
  uploadStartedCallback?: CallableFunction;
} & AvatarUploadStyleAttrs;

export const AvatarUpload = (props: AvatarUploadProps) => {
  const [dropzone, setDropzone] = React.useState<any>();
  const [uploaded, setUploaded] = React.useState<boolean>();
  const nodeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (Dropzone.instances.length > 0) return;

    const newDropzone = new Dropzone(nodeRef.current, {
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
            if (response.status !== 'Success') {
              return done(
                'Failed to get an S3 signed upload URL',
                response.error
              );
            }
            file.uploadURL = response.result;
            setUploaded(true);
            done();
            setTimeout(() => newDropzone.processFile(file));
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

    newDropzone.on('processing', (file) => {
      newDropzone.options.url = file.uploadURL;
      if (props.uploadStartedCallback) {
        props.uploadStartedCallback();
      }
    });

    newDropzone.on('complete', (file) => {
      if (props.uploadCompleteCallback) {
        props.uploadCompleteCallback(file);
      }
    });

    setDropzone(newDropzone);

    const cleanUpFiles = () => {
      dropzone.files.map((file) => dropzone.removeFile(file));
    };

    nodeRef.current.addEventListener('cleardropzone', cleanUpFiles);
    return () => {
      nodeRef.current.removeEventListener('cleardropzone', cleanUpFiles);
    };
  }, []);

  const { account, darkMode, scope, size = 'small' } = props;

  const avatarSize = size === 'small' ? 60 : 108;
  const forUser = scope === 'user';
  const forCommunity = scope === 'community';

  const avatar = forUser
    ? account?.profile?.getAvatar(avatarSize)
    : forCommunity
    ? app.chain?.meta.getAvatar(avatarSize)
    : undefined;

  const localUploadURL = dropzone?.option?.url;

  return (
    <div
      className={getClasses<AvatarUploadStyleAttrs>(
        { size },
        ComponentType.AvatarUpload
      )}
      ref={nodeRef}
    >
      <div
        className={getClasses<{ darkMode?: boolean }>(
          { darkMode },
          'icon-button-container dz-clickable'
        )}
      >
        <CWIconButton
          iconButtonTheme="primary"
          iconName="plusCircle"
          iconSize={size === 'small' ? 'small' : 'medium'}
        />
      </div>
      {!uploaded && (
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
          { hidden: !uploaded },
          'dropzone-preview-container'
        )}
        style={{
          backgroundImage: `url(${localUploadURL})`,
          backgroundSize: `${avatarSize}px`,
        }}
      />
    </div>
  );
};
