import axios, { Method } from 'axios';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

import { success, TypedRequestBody, TypedResponse } from '../types';
import { DB } from '../../../chain-events/services/database/database';
import { AppError } from '../../../common-common/src/errors';

type generateImageReq = {
  description: string;
};

type generateImageResp = {
  imageUrl: string;
  raw: string;
};
const generateImage = async (
  models: DB,
  req: TypedRequestBody<generateImageReq>,
  res: TypedResponse<generateImageResp>
) => {
  const { description } = req.body;

  if (!description) {
    throw new AppError('No description provided');
  }

  const encodedParams = new URLSearchParams();
  encodedParams.append('upscale', '1');
  encodedParams.append('model', 'stablediffusion_1_5');
  encodedParams.append('steps', '30');
  encodedParams.append('sampler', 'dpm');
  encodedParams.append('guidance', '8');
  encodedParams.append('prompt', description);

  const options = {
    method: 'POST' as Method,
    url: 'https://dezgo.p.rapidapi.com/text2image',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'X-RapidAPI-Key': '016a70f43fmshd073e94a09775a6p103ff1jsnd2b0f07682d5', // TODO: Replace with real .env key later
      'X-RapidAPI-Host': 'dezgo.p.rapidapi.com',
    },
    data: encodedParams,
  };

  let imageResp;
  let image;
  try {
    console.log('Starting Image Generation', Date.now());

    imageResp = await axios.request(options);

    console.log('headers', imageResp.headers);
    image = 'data:image/png;base64,'.concat(
      Buffer.from(imageResp.data).toString('base64')
    );

    console.log('End Image Generation', Date.now());
  } catch (e) {
    throw new AppError('Problem!');
  }

  const s3 = new AWS.S3();
  const params = {
    Bucket: 'commonwealth-uploads',
    Key: `${uuidv4()}.png`,
    Expires: 3600,
    ContentType: 'image/png',
  };

  const imageUrl = '';
  //   try {
  //     console.log('Starting Image Upload', Date.now());
  //     imageUrl = await s3.getSignedUrl('putObject', params);

  //     await axios.put(imageUrl, image, {
  //       headers: {
  //         'Content-Type': 'image/png',
  //       },
  //       transformRequest: [(data) => data],
  //     });
  //     console.log('End Image Upload', Date.now());
  //   } catch (e) {
  //     console.log(e);
  //     throw new AppError('Problem!');
  //   }

  const trimmedURL = imageUrl.slice(0, imageUrl.indexOf('?'));

  return success(res, { imageUrl: trimmedURL, raw: imageResp });
};

export default generateImage;
