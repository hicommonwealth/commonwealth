import { AppError, ServerError, blobStorage } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

let openai: OpenAI | undefined = undefined;

if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      organization:
        process.env.OPENAI_ORGANIZATION || 'org-D0ty00TJDApqHYlrn1gge2Ql',
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (e) {
    console.error('OpenAI initialization failed.', e);
  }
} else {
  console.warn(
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
  console.log('Generating image with Runware model: runware:100@1');
  const response = await fetch('https://api.runware.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RUNWARE_API_KEY}`,
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
    console.error('Runware API error:', error);
    throw error;
  }

  const data = await response.json();
  console.log('Successfully generated image with Runware', data);
  return data.data[0].imageURL;
};

const generateImageWithOpenAI = async (description: string) => {
  if (!openai) {
    throw new ServerError('OpenAI not initialized');
  }

  console.log('Generating image with OpenAI model: dall-e-2');
  const response = await openai.images.generate({
    model: 'dall-e-2',
    n: 1,
    prompt: description,
    size: '256x256',
    response_format: 'url',
  });

  console.log('Successfully generated image with OpenAI');
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

  let image;
  try {
    console.log(`USE_RUNWARE environment variable: ${process.env.USE_RUNWARE}`);
    if (process.env.USE_RUNWARE === 'true') {
      image = await generateImageWithRunware(description);
    } else {
      image = await generateImageWithOpenAI(description);
    }
  } catch (e) {
    console.error(
      'Problem generating image:',
      e instanceof Error ? e : new Error(String(e)),
    );
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
