import { formatBucketUrlToAssetCDN } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { compressImage } from 'client/scripts/utils/ImageCompression';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

interface UploadFileProps {
  file: File;
}

export const uploadFile = async ({
  file,
}: UploadFileProps): Promise<string> => {
  const response = await axios.post(
    `${SERVER_URL}/${ApiEndpoints.UPLOAD_FILE}`,
    {
      name: file.name,
      mimetype: file.type,
      auth: true,
      jwt: userStore.getState().jwt,
    },
  );

  if (response?.data?.status !== 'Success') {
    throw new Error('failed to upload file');
  }

  const signedUploadUrl = response?.data?.result;

  const compressedFile = file.type.startsWith('image/')
    ? await compressImage(file)
    : file;

  // upload the file via the signed URL
  await axios.put(signedUploadUrl, compressedFile, {
    headers: {
      'Content-Type': file.type,
    },
  });

  return formatBucketUrlToAssetCDN(signedUploadUrl.split('?')[0]);
};

type UseUploadFileMutationProps = {
  onSuccess?: (uploadedFileURL) => void;
};

const useUploadFileMutation = ({
  onSuccess,
}: UseUploadFileMutationProps = {}) => {
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: (uploadedFileURL) => {
      onSuccess?.(uploadedFileURL);
    },
  });
};

export default useUploadFileMutation;
