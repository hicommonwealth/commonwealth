import { AppError } from '@hicommonwealth/core';

import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
  const extension = req.body.name.split('.').pop();
  const filename = `${uuidv4()}.${extension}`;
  const contentType = req.body.mimetype;
  if (
    ['image/gif', 'image/png', 'image/jpeg', 'image/webp'].indexOf(
      contentType,
    ) === -1
  ) {
    return next(new AppError(Errors.ImageType));
  }

  const s3 = new S3();
  const params = {
    Bucket: 'assets.commonwealth.im',
    Key: `${filename}`,
    Expires: 3600,
    ContentType: contentType,
  };

  try {
    const url = await getSignedUrl(s3, new PutObjectCommand(params));
    res.json({ status: 'Success', result: url });
  } catch (err) {
    res.json({ status: 'Failure', result: err });
  }
};

export default getUploadSignature;
