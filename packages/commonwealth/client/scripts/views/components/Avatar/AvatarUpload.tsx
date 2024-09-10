import axios from 'axios';
import 'components/Avatar/AvatarUpload.scss';
import { notifyError } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import useUserStore from 'state/ui/user';
import { compressImage } from 'utils/ImageCompression';
import { Avatar } from 'views/components/Avatar/Avatar';
import { replaceBucketWithCDN } from '../../../helpers/awsHelpers';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { getClasses } from '../component_kit/helpers';
import { ComponentType } from '../component_kit/types';

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
  account?: {
    avatarUrl: string;
    userId: number;
  };
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
  const user = useUserStore();
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
    onDropAccepted: async (acceptedFiles: any) => {
      try {
        const response = await axios.post(`${SERVER_URL}/getUploadSignature`, {
          name: acceptedFiles[0].name, // imageName.png
          mimetype: acceptedFiles[0].type, // image/png
          auth: true,
          jwt: user.jwt,
        });
        if (response.data.status !== 'Success') throw new Error();

        const uploadURL = response.data.result;
        acceptedFiles[0].uploadURL = uploadURL;

        const compressedFile = await compressImage(acceptedFiles[0]);

        // Upload the file to S3
        await uploadToS3(compressedFile, uploadURL);

        if (uploadCompleteCallback) {
          acceptedFiles[0].uploadURL = replaceBucketWithCDN(uploadURL);
          uploadCompleteCallback([acceptedFiles[0]]);
        }
      } catch (e) {
        notifyError('Failed to get an S3 signed upload URL');
      }
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
