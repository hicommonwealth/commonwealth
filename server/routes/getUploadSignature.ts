import AWS from 'aws-sdk';
import uuidv4 from 'uuid/v4';

import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

AWS.config.update({
  signatureVersion: 'v4'
});

const getUploadSignature = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Must be logged in'));
  }
  if (!req.body.name || !req.body.mimetype) {
    return next(new Error('Must specify name and mimetype'));
  }
  const extension = req.body.name.split('.').pop();
  const filename = uuidv4() + '.' + extension;
  const contentType = req.body.mimetype;
  if (['image/gif', 'image/png', 'image/jpeg', 'image/webp'].indexOf(contentType) === -1) {
    return next(new Error('Can only upload JPG, PNG, GIF, and WEBP images'));
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
