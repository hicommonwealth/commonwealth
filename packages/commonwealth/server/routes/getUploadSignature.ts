import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';
import { AppError, ServerError } from 'common-common/src/errors';

const log = factory.getLogger(formatFilename(__filename));

AWS.config.update({
  signatureVersion: 'v4'
});

export const Errors = {
  NotLoggedIn: 'Must be logged in',
  MissingParams: 'Must specify name and mimetype',
  ImageType: 'Can only upload JPG, PNG, GIF, and WEBP images',
};

const getUploadSignature = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.name || !req.body.mimetype) {
    return next(new AppError(Errors.MissingParams));
  }
  const extension = req.body.name.split('.').pop();
  const filename = `${uuidv4()}.${extension}`;
  const contentType = req.body.mimetype;
  if (['image/gif', 'image/png', 'image/jpeg', 'image/webp'].indexOf(contentType) === -1) {
    return next(new AppError(Errors.ImageType));
  }

  const s3 = new AWS.S3();
  const params = {
    Bucket: 'commonwealth-uploads',
    Key: `${filename}`,
    Expires: 3600,
    ContentType: contentType,
  };

  s3.getSignedUrl('putObject', params, (err, url) => {
    if (err) {
      res.json({ status: 'Failure', result: err });
    } else {
      res.json({ status: 'Success', result: url });
    }
  });
};

export default getUploadSignature;
