import { AppError, blobStorage } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const Errors = {
  NotLoggedIn: 'Must be signed in',
  MissingParams: 'Must specify name and mimetype',
  ImageType: 'Can only upload JPG, PNG, GIF, and WEBP images',
};

const getUploadSignature = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.name || !req.body.mimetype) {
    return next(new AppError(Errors.MissingParams));
  }

  const contentType = req.body.mimetype;
  if (
    ['image/gif', 'image/png', 'image/jpeg', 'image/webp'].indexOf(
      contentType,
    ) === -1
  ) {
    return next(new AppError(Errors.ImageType));
  }

  let extension = req.body.name.split('.').pop();

  if (extension === req.body.name) {
    extension = contentType.split('/').pop();
  } else if (!['gif', 'png', 'jpeg', 'webp', 'jpg'].includes(extension)) {
    return next(new AppError(Errors.ImageType));
  }

  const filename = `${uuidv4()}.${extension}`;

  try {
    const url = await blobStorage().getSignedUrl({
      key: filename,
      bucket: 'assets',
      contentType,
      ttl: 3600,
    });
    res.json({ status: 'Success', result: url });
  } catch (err) {
    res.json({ status: 'Failure', result: err });
  }
};

export default getUploadSignature;
