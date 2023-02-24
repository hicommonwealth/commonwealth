import React, { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import $ from 'jquery';

import 'components/avatar_upload.scss';

import app from 'state';
import { CWIconButton } from './component_kit/cw_icon_button';
import { getClasses } from './component_kit/helpers';
import { ComponentType } from './component_kit/types';
import type { Account } from 'models';

type AvatarUploadStyleProps = {
  size?: 'small' | 'large';
};

type AvatarUploadProps = {
  account?: Account;
  darkMode?: boolean;
  scope: 'community' | 'user';
  uploadCompleteCallback?: () => void;
  uploadStartedCallback?: () => void;
} & AvatarUploadStyleProps;

export const AvatarUpload = ({
  account,
  darkMode,
  scope,
  size = 'small',
}: AvatarUploadProps) => {
  const [files, setFiles] = useState([]);
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
    },
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    },
  });

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, []);

  const avatarSize = size === 'small' ? 60 : 108;
  const forUser = scope === 'user';
  const forCommunity = scope === 'community';

  const avatar = forUser
    ? account?.profile?.getAvatar(avatarSize)
    : forCommunity
    ? app.chain?.meta.getAvatar(avatarSize)
    : undefined;

  return (
    <div
      {...getRootProps({
        className: getClasses<AvatarUploadStyleProps>(
          { size },
          ComponentType.AvatarUpload
        ),
      })}
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
      <div className="inner-container">
        <input {...getInputProps()} />
        {avatar ? (
          avatar
        ) : files.length === 1 ? (
          <img
            src={files[0].preview}
            onLoad={() => {
              URL.revokeObjectURL(files[0].preview);
            }}
          />
        ) : null}
      </div>
    </div>
  );
};
