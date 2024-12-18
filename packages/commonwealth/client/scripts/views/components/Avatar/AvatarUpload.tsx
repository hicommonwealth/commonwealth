import { notifyError } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import app from 'state';
import { useUploadFileMutation } from 'state/api/general';
import { Avatar } from 'views/components/Avatar/Avatar';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { getClasses } from '../component_kit/helpers';
import { ComponentType } from '../component_kit/types';
import './AvatarUpload.scss';

type AvatarUploadStyleProps = {
  size?: 'small' | 'large';
};

type AvatarUploadProps = {
  account?: {
    avatarUrl: string;
    userId: number;
  };
  darkMode?: boolean;
  scope: 'community' | 'user';
  uploadCompleteCallback?: (uploadUrl: string) => void;
  uploadStartedCallback?: () => void;
} & AvatarUploadStyleProps;

export const AvatarUpload = ({
  account,
  darkMode,
  scope,
  size = 'small',
  uploadCompleteCallback,
  uploadStartedCallback,
}: AvatarUploadProps) => {
  const [files, setFiles] = useState([]);

  const { mutateAsync: uploadImage } = useUploadFileMutation({
    onSuccess: uploadCompleteCallback,
  });

  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    maxSize: 10000000,
    accept: {
      'image/*': [],
    },
    onDrop: (acceptedFiles) => {
      if (uploadStartedCallback) {
        uploadStartedCallback();
      }

      setFiles(
        // @ts-expect-error StrictNullChecks
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          }),
        ),
      );
    },
    onDropAccepted: (acceptedFiles: Array<File>) => {
      uploadImage({
        file: acceptedFiles[0],
      }).catch((e) => {
        console.error(e);
        notifyError('Failed to get an S3 signed upload URL');
      });
    },
  });

  const avatarSize = size === 'small' ? 60 : 108;
  const forUser = scope === 'user';
  const avatarUrl = forUser
    ? account?.avatarUrl || ''
    : app.chain?.meta?.icon_url || '';
  const address = forUser ? account?.userId : undefined;
  const showAvatar = avatarUrl || address;

  return (
    <div
      {...getRootProps({
        className: getClasses<AvatarUploadStyleProps>(
          { size },
          ComponentType.AvatarUpload,
        ),
      })}
    >
      <div
        className={getClasses<{ darkMode?: boolean } & AvatarUploadStyleProps>(
          { darkMode, size },
          'icon-button-container',
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

        {files.length === 1 ? (
          <img
            // @ts-expect-error StrictNullChecks
            src={files[0].preview}
            onLoad={() => {
              // @ts-expect-error StrictNullChecks
              URL.revokeObjectURL(files[0].preview);
            }}
          />
        ) : (
          showAvatar && (
            <Avatar address={address} url={avatarUrl} size={avatarSize} />
          )
        )}
      </div>
    </div>
  );
};
