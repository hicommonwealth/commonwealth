import { AppError, ServerError, logger } from '@hicommonwealth/core';
import { DB, generateImage } from '@hicommonwealth/model';
import type { ImageGenerationModel } from '@hicommonwealth/shared';
import { OpenAI } from 'openai';
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
    log.error('OpenAI initialization failed', e);
  }
} else {
  log.warn(
    'OpenAI key not configured. You will be unable to generate images on client.',
  );
}

type generateImageReq = {
  description: string;
  model?: ImageGenerationModel;
  n?: number;
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high';
  response_format?: 'url' | 'b64_json';
  size?:
    | '256x256'
    | '512x512'
    | '1024x1024'
    | '1792x1024'
    | '1024x1792'
    | '1536x1024'
    | '1024x1536'
    | 'auto';
  style?: 'vivid' | 'natural';
  referenceImageUrls?: string[];
  maskUrl?: string;
};

type generateImageResp = {
  imageUrl: string;
};

const generateImageHandler = async (
  models: DB,
  req: TypedRequestBody<generateImageReq>,
  res: TypedResponse<generateImageResp>,
) => {
  log.info('Received /generateImage request with body:', req.body);

  const {
    description,
    model,
    n,
    quality,
    response_format,
    size,
    style,
    referenceImageUrls,
    maskUrl,
  } = req.body;

  if (!description) {
    log.warn('/generateImage: No description provided in request body');
    throw new AppError('No description provided');
  }

  const options: Parameters<typeof generateImage>[2] = {
    model,
    n,
    quality,
    response_format,
    size,
    style,
    referenceImageUrls,
    maskUrl,
  };

  log.info('/generateImage: Calling generateImage function with options:', {
    promptLength: description.length,
    ...options,
  });

  try {
    const imageUrl = await generateImage(description, openai, options);
    log.info('/generateImage: Successfully generated and uploaded image', {
      imageUrl,
    });
    return success(res, { imageUrl });
  } catch (e) {
    log.error('Problem generating image in handler', e);
    throw new ServerError('Problem Generating Image!', e);
  }
};

export default generateImageHandler;
