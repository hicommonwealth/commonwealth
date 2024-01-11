import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import { Configuration, OpenAIApi } from 'openai';
import { v4 as uuidv4 } from 'uuid';

import { AppError } from '@hicommonwealth/adapters';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

const configuration = new Configuration({
  organization: 'org-D0ty00TJDApqHYlrn1gge2Ql',
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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

  if (!description) {
    throw new AppError('No description provided');
  }

  let image;
  try {
    const response = await openai.createImage({
      prompt: description,
      size: '256x256',
      response_format: 'url',
    });

    image = response.data.data[0].url;
  } catch (e) {
    console.log(e);
    throw new AppError('Problem Generating Image!');
  }

  const s3 = new AWS.S3();
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
    const upload = await s3.upload(params).promise();
    imageUrl = upload.Location;
  } catch (e) {
    console.log(e);
    throw new AppError('Problem uploading image!');
  }

  return success(res, { imageUrl });
};

export default generateImage;
