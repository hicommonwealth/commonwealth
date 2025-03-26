import {
  AppError,
  ServerError,
  blobStorage,
  logger,
} from '@hicommonwealth/core';
import { DB, config } from '@hicommonwealth/model';
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
    log.error(
      'OpenAI initialization failed: ' +
        (e instanceof Error ? e.message : String(e)),
    );
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

const generateImageWithRunware = async (description: string) => {
  log.info('Generating image with Runware model: runware:100@1');
  const response = await fetch('https://api.runware.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.IMAGE_GENERATION.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify([
      {
        taskType: 'imageInference',
        taskUUID: uuidv4(),
        positivePrompt: description,
        width: 256,
        height: 256,
        model: 'runware:100@1',
        numberResults: 1,
        outputType: 'URL',
        outputFormat: 'PNG',
      },
    ]),
  });

  if (!response.ok) {
    const error = new Error(`Runware API error: ${response.statusText}`);
    log.error('Runware API error: ' + error.message);
    throw error;
  }

  const data = await response.json();
  log.info('Successfully generated image with Runware');
  return data.data[0].imageURL;
};

const generateImageWithOpenAI = async (description: string) => {
  log.info('Generating image with OpenAI model: dall-e-2');
  const response = await openai!.images.generate({
    model: 'dall-e-2',
    n: 1,
    prompt: description,
    size: '256x256',
    response_format: 'url',
  });

  log.info('Successfully generated image with OpenAI');
  return response.data[0].url;
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

  // Check OpenAI initialization if we're not using Runware
  if (!config.IMAGE_GENERATION.FLAG_USE_RUNWARE && !openai) {
    log.error('OpenAI not initialized and Runware not enabled');
    throw new ServerError('OpenAI not initialized');
  }

  let image;
  try {
    log.info(
      `Using image generation service: ${config.IMAGE_GENERATION.FLAG_USE_RUNWARE ? 'Runware' : 'OpenAI'}`,
    );
    if (config.IMAGE_GENERATION.FLAG_USE_RUNWARE) {
      if (!config.IMAGE_GENERATION.RUNWARE_API_KEY) {
        throw new ServerError('Runware API key not configured');
      }
      image = await generateImageWithRunware(description);
    } else {
      image = await generateImageWithOpenAI(description);
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    log.error('Problem generating image: ' + errorMsg);
    throw new ServerError('Problem Generating Image!', e);
  }

  try {
    log.info('Uploading generated image to S3');
    const resp = await fetch(image);
    const buffer = await resp.buffer();
    const { url } = await blobStorage().upload({
      key: `${uuidv4()}.png`,
      bucket: 'assets',
      content: buffer,
      contentType: 'image/png',
    });
    log.info('Successfully uploaded image to S3: ' + url);
    return success(res, { imageUrl: url });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    log.error('Problem uploading image: ' + errorMsg);
    throw new ServerError('Problem uploading image!', e);
  }
};

export default generateImage;
