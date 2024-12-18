import {
  AppError,
  ServerError,
  blobStorage,
  logger,
} from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

let openai: OpenAI | undefined = undefined;

const log = logger(import.meta);

if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      organization:
        process.env.OPENAI_ORGANIZATION || 'org-D0ty00TJDApqHYlrn1gge2Ql',
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (e) {
    log.error('OpenAI initialization failed.', e);
  }
} else {
  log.warn(
    'OpenAI key not configured. You will be unable to generate images on client.',
  );
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
    throw new ServerError('OpenAI not initialized');
  }

  if (!description) {
    throw new AppError('No description provided');
  }

  let image;
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      n: 1,
      prompt: description,
      size: '512x512',
      response_format: 'url',
    });

    image = response.data[0].url;
  } catch (e) {
    throw new ServerError('Problem Generating Image!', e);
  }

  try {
    const resp = await fetch(image);
    const buffer = await resp.buffer();
    const { url } = await blobStorage().upload({
      key: `${uuidv4()}.png`,
      bucket: 'assets',
      content: buffer,
      contentType: 'image/png',
    });
    return success(res, { imageUrl: url });
  } catch (e) {
    throw new ServerError('Problem uploading image!', e);
  }
};

export default generateImage;
