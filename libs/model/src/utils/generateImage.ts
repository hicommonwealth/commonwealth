import { blobStorage, logger } from '@hicommonwealth/core';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { compressServerImage } from './imageCompression';

const log = logger(import.meta);

export const ImageGenerationErrors = {
  OpenAINotConfigured: 'OpenAI key not configured',
  OpenAIInitFailed: 'OpenAI initialization failed',
  RunwareNotConfigured: 'Runware API key not configured',
  RequestFailed: 'failed to generate image',
  ImageGenerationFailure: 'failed to generate image',
  UploadFailed: 'failed to upload image to S3',
};

const generateImageWithRunware = async (prompt: string) => {
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
        positivePrompt: prompt,
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
    log.error('Runware API error:', error);
    throw error;
  }

  const data = await response.json();
  log.info('Successfully generated image with Runware');
  return data.data[0].imageURL;
};

const generateImageWithOpenAI = async (prompt: string, openai: OpenAI) => {
  log.info('Generating image with OpenAI model: dall-e-3');
  const imageResponse = await openai.images.generate({
    prompt,
    size: '1024x1024',
    model: 'dall-e-3',
    n: 1,
    response_format: 'url',
  });
  log.info('Successfully generated image with OpenAI');
  return imageResponse.data[0].url || '';
};

export const generateImage = async (prompt: string, openai?: OpenAI) => {
  // Validate configuration
  if (!config.IMAGE_GENERATION.FLAG_USE_RUNWARE && !openai) {
    if (!config.OPENAI.API_KEY) {
      throw new Error(ImageGenerationErrors.OpenAINotConfigured);
    }
    if (!openai) {
      throw new Error(ImageGenerationErrors.OpenAIInitFailed);
    }
  }

  // Generate image
  let imageUrl: string;
  try {
    log.info(
      `Using image generation service: ${config.IMAGE_GENERATION.FLAG_USE_RUNWARE ? 'Runware' : 'OpenAI'}`,
    );

    if (config.IMAGE_GENERATION.FLAG_USE_RUNWARE) {
      if (!config.IMAGE_GENERATION.RUNWARE_API_KEY) {
        throw new Error(ImageGenerationErrors.RunwareNotConfigured);
      }
      imageUrl = await generateImageWithRunware(prompt);
    } else {
      if (!openai) {
        throw new Error(ImageGenerationErrors.OpenAIInitFailed);
      }
      imageUrl = await generateImageWithOpenAI(prompt, openai);
    }
  } catch (e) {
    log.error(
      'Error generating image:',
      e instanceof Error ? e : new Error(String(e)),
    );
    throw new Error(ImageGenerationErrors.ImageGenerationFailure);
  }

  // Upload to S3
  try {
    log.info('Uploading generated image to S3');
    const resp = await fetch(imageUrl);
    const buffer = await resp.buffer();
    const compressedBuffer = await compressServerImage(buffer);
    const { url } = await blobStorage().upload({
      key: `${uuidv4()}.png`,
      bucket: 'assets',
      content: compressedBuffer,
      contentType: 'image/png',
    });
    log.info(`Successfully uploaded image to S3: ${url}`);
    return url;
  } catch (e) {
    log.error(
      'Error uploading image to S3:',
      e instanceof Error ? e : new Error(String(e)),
    );
    throw new Error(ImageGenerationErrors.UploadFailed);
  }
};
