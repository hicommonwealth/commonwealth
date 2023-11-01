import { AppError } from '../../../common-common/src/errors';
import { getFileSizeBytes } from './getFilesSizeBytes';

export const MAX_COMMUNITY_IMAGE_SIZE_BYTES = 500 * 1024;

const Errors = {
  ImageDoesntExist: `Image url provided doesn't exist`,
  ImageTooLarge: (max: number) => `Image must be smaller than ${max}kb`,
};

export async function checkUrlFileSize(url: string, maxFileSizeBytes: number) {
  const fileSizeBytes = await getFileSizeBytes(url);
  if (fileSizeBytes === 0) {
    throw new AppError(Errors.ImageDoesntExist);
  }
  if (fileSizeBytes > maxFileSizeBytes) {
    throw new AppError(Errors.ImageTooLarge(maxFileSizeBytes));
  }
}
