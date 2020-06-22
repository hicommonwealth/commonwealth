import AWS from 'aws-sdk';
import uuidv4 from 'uuid/v4';

import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

AWS.config.update({
  signatureVersion: 'v4'
});

export const Errors = {
  NotLoggedIn: 'Must be logged in',
  MissingParams: 'Must specify name and mimetype',
  ImageType: 'Can only upload JPG, PNG, GIF, and WEBP images',
};

const getUploadSignature = async (models, req: Request, res: Response, next: NextFunction) => {
  console.log(req);
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.name || !req.body.mimetype) {
    return next(new Error(Errors.MissingParams));
  }
  const extension = req.body.name.split('.').pop();
  const filename = uuidv4() + '.' + extension;
  const contentType = req.body.mimetype;
  if (['image/gif', 'image/png', 'image/jpeg', 'image/webp'].indexOf(contentType) === -1) {
    return next(new Error(Errors.ImageType));
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
