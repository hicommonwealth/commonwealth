import { AppError, ServerError, logger } from '@hicommonwealth/core';
import { DB, generateImage } from '@hicommonwealth/model';
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
};

type generateImageResp = {
  imageUrl: string;
};

const generateImageHandler = async (
  models: DB,
  req: TypedRequestBody<generateImageReq>,
  res: TypedResponse<generateImageResp>,
) => {
  const { description } = req.body;

  if (!description) {
    throw new AppError('No description provided');
  }

  try {
    const imageUrl = await generateImage(description, openai);
    return success(res, { imageUrl });
  } catch (e) {
    log.error('Problem generating image', e);
    throw new ServerError('Problem Generating Image!', e);
  }
};

export default generateImageHandler;
