import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

import { AppError } from '@hicommonwealth/core';
import { DB, formatS3Url } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

// @ts-expect-error StrictNullChecks
let openai: OpenAI = undefined;

try {
  openai = new OpenAI({
    organization: 'org-D0ty00TJDApqHYlrn1gge2Ql',
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (e) {
  console.warn('OpenAI initialization failed.');
}

type generateImageReq = {
  description: string;
};

type generateImageResp = {
  imageUrl: string;
};
const generateImage = async (
  models: DB,
  req: TypedRequestBody<generateImageReq>,
  res: TypedResponse<generateImageResp>,
) => {
  const { description } = req.body;

  if (!openai) {
    throw new AppError('OpenAI not initialized');
  }

  if (!description) {
    throw new AppError('No description provided');
  }

  let image;
  try {
    const response = await openai.images.generate({
      prompt: description,
      size: '256x256',
      response_format: 'url',
    });

    image = response.data[0].url;
  } catch (e) {
    console.log(e);
    throw new AppError('Problem Generating Image!');
  }

  const s3 = new S3();
  const resp = await fetch(image);
  const buffer = await resp.buffer();
  const params = {
    Bucket: 'assets.commonwealth.im',
    Key: `${uuidv4()}.png`,
    Body: buffer,
    ContentType: 'image/png',
  };

  let imageUrl = '';
  try {
    const upload = await new Upload({
      client: s3,
      params,
    }).done();
    // @ts-expect-error StrictNullChecks
    imageUrl = formatS3Url(upload.Location);
  } catch (e) {
    console.log(e);
    throw new AppError('Problem uploading image!');
  }

  return success(res, { imageUrl });
};

export default generateImage;
