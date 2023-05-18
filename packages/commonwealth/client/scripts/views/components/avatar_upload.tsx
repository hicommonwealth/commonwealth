import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

import 'components/avatar_upload.scss';

import app from 'state';
import {
  getAvatarFromChainInfo,
  getAvatarFromProfile,
} from '../../helpers/avatarHelpers';
import Account from '../../models/Account';
import { CWIconButton } from './component_kit/cw_icon_button';
import { getClasses } from './component_kit/helpers';
import { ComponentType } from './component_kit/types';
import { notifyError } from 'controllers/app/notifications';

const uploadToS3 = async (file: File, signedUrl: string) => {
  const options = {
    headers: {
      'Content-Type': file.type,
    },
  };

  try {
    await axios.put(signedUrl, file, options);
  } catch (error) {
    notifyError('Failed to upload the file to S3');
    throw error;
  }
};

type AvatarUploadStyleProps = {
  size?: 'small' | 'large';
};

type AvatarUploadProps = {
  account?: Account;
  darkMode?: boolean;
  scope: 'community' | 'user';
  uploadCompleteCallback?: (file: Array<any>) => void;
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
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    },
    onDropAccepted: async (acceptedFiles: any) => {
      try {
        const response = await axios.post(
          `${app.serverUrl()}/getUploadSignature`,
          {
            name: acceptedFiles[0].name, // imageName.png
            mimetype: acceptedFiles[0].type, // image/png
            auth: true,
            jwt: app.user.jwt,
          }
        );
        if (response.data.status !== 'Success') throw new Error();

        const uploadURL = response.data.result;
        acceptedFiles[0].uploadURL = uploadURL;

        // Upload the file to S3
        await uploadToS3(acceptedFiles[0], uploadURL);

        if (uploadCompleteCallback) {
          uploadCompleteCallback([acceptedFiles[0]]);
        }
      } catch (e) {
        notifyError('Failed to get an S3 signed upload URL');
      }
    },
  });

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, []);

  const avatarSize = size === 'small' ? 60 : 108;
  const forUser = scope === 'user';
  const forCommunity = scope === 'community';

  const avatar = forUser
    ? getAvatarFromProfile(account?.profile, avatarSize)
    : forCommunity
    ? getAvatarFromChainInfo(app.chain?.meta, avatarSize)
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
        className={getClasses<{ darkMode?: boolean } & AvatarUploadStyleProps>(
          { darkMode, size },
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
