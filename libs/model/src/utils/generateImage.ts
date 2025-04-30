import { blobStorage, logger } from '@hicommonwealth/core';
import { Buffer } from 'buffer';
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
  ImageEditFailure: 'failed to edit image',
  UploadFailed: 'failed to upload image to S3',
  FetchReferenceImageFailed: 'failed to fetch reference image from URL',
  InvalidReferenceImages: 'invalid reference images provided for editing',
};

const generateImageWithRunware = async (prompt: string) => {
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
    log.error('Runware API error', error);
    throw error;
  }

  const data = await response.json();
  return data.data[0].imageURL;
};

const generateImageWithOpenAI = async (
  prompt: string,
  openai: OpenAI,
  options: {
    model?: string;
    n?: number;
    quality?: 'low' | 'medium' | 'high';
    size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  } = {},
) => {
  const generationParams = {
    prompt,
    model: options.model || 'gpt-image-1',
    n: options.n || 1,
    quality: options.quality,
    size: options.size || '1024x1024',
  };
  // Remove undefined keys before logging and sending
  Object.keys(generationParams).forEach((key) => {
    const paramKey = key as keyof typeof generationParams;
    if (generationParams[paramKey] === undefined) {
      delete generationParams[paramKey];
    }
  });

  log.info(
    '[generateImageWithOpenAI] Calling OpenAI API with params:',
    generationParams,
  );

  try {
    const imageResponse = await openai.images.generate(generationParams as any);
    log.info('[generateImageWithOpenAI] OpenAI API response received.');

    // GPT-Image-1 always returns b64_json, so return that directly.
    return { b64_json: imageResponse.data[0].b64_json || '' };
  } catch (error) {
    if (error instanceof Error) {
      log.error('[generateImageWithOpenAI] OpenAI API call failed:', error);
    } else {
      log.error(
        '[generateImageWithOpenAI] OpenAI API call failed with unknown error type:',
        new Error(String(error)),
      );
    }
    throw error;
  }
};

const editImageWithOpenAI = async (
  prompt: string,
  referenceImagesData: { filename: string; buffer: Buffer }[],
  openai: OpenAI,
  options: {
    mask?: Buffer;
    model?: string;
    n?: number;
    size?: '256x256' | '512x512' | '1024x1024';
  } = {},
) => {
  log.info('[editImageWithOpenAI] Preparing to call OpenAI edits endpoint.');

  if (!referenceImagesData || referenceImagesData.length === 0) {
    log.error('[editImageWithOpenAI] No reference images provided.');
    throw new Error(ImageGenerationErrors.InvalidReferenceImages);
  }

  if (referenceImagesData.length > 1) {
    log.warn(
      `[editImageWithOpenAI] Multiple reference images provided (${referenceImagesData.length}), but using only the first one due to current limitations.`,
    );
  }
  const primaryReferenceImage = {
    file: referenceImagesData[0].buffer,
    name: referenceImagesData[0].filename || 'reference.png',
  };

  const editParams: OpenAI.Images.ImageEditParams = {
    image: primaryReferenceImage as any,
    prompt,
    model: options.model || 'gpt-image-1',
    n: options.n || 1,
    size: options.size || '1024x1024',
  };

  if (options.mask) {
    editParams.mask = {
      file: options.mask,
      name: 'mask.png',
    } as any;
  }

  Object.keys(editParams).forEach((key) => {
    const paramKey = key as keyof typeof editParams;
    if (editParams[paramKey] === undefined || editParams[paramKey] === null) {
      delete editParams[paramKey];
    }
  });

  log.info('[editImageWithOpenAI] Calling OpenAI API with params:', {
    ...editParams,
    image: `[${referenceImagesData.length} images]`,
    mask: editParams.mask ? '[mask provided]' : '[no mask]',
  });

  try {
    const imageResponse = await openai.images.edit(editParams as any);
    log.info('[editImageWithOpenAI] OpenAI API response received.');

    return { b64_json: imageResponse.data[0].b64_json || '' };
  } catch (error) {
    if (error instanceof Error) {
      log.error('[editImageWithOpenAI] OpenAI API call failed.', error);
    } else {
      log.error(
        '[editImageWithOpenAI] OpenAI API call failed with unknown error type:',
        new Error(String(error)),
      );
    }

    const paramsForLogging = {
      prompt: editParams.prompt,
      model: editParams.model,
      n: editParams.n,
      size: editParams.size,
      image_present: !!editParams.image,
      mask_present: !!editParams.mask,
    };
    log.info(
      '[editImageWithOpenAI] Parameters used in failed call:',
      paramsForLogging,
    );

    throw new Error(ImageGenerationErrors.ImageEditFailure);
  }
};

export const generateImage = async (
  prompt: string,
  openai?: OpenAI,
  options: {
    model?: string;
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
  } = {},
) => {
  const useEditEndpoint =
    options.referenceImageUrls && options.referenceImageUrls.length > 0;

  if (!config.IMAGE_GENERATION.FLAG_USE_RUNWARE && !openai) {
    if (!config.OPENAI.API_KEY) {
      throw new Error(ImageGenerationErrors.OpenAINotConfigured);
    }
    if (!openai) {
      throw new Error(ImageGenerationErrors.OpenAIInitFailed);
    }
  }

  let imageResult: { url?: string; b64_json?: string };
  try {
    if (config.IMAGE_GENERATION.FLAG_USE_RUNWARE && !useEditEndpoint) {
      log.info('[generateImage] Using Runware for generation.');
      if (!config.IMAGE_GENERATION.RUNWARE_API_KEY) {
        throw new Error(ImageGenerationErrors.RunwareNotConfigured);
      }
      const runwareUrl = await generateImageWithRunware(prompt);
      imageResult = { url: runwareUrl };
    } else {
      log.info('[generateImage] Using OpenAI for generation.');
      if (!openai) {
        log.error('[generateImage] OpenAI instance not available when needed.');
        throw new Error(ImageGenerationErrors.OpenAIInitFailed);
      }

      if (useEditEndpoint) {
        log.info(
          '[generateImage] Using OpenAI edits endpoint with reference images.',
        );
        const referenceImagesData: { filename: string; buffer: Buffer }[] = [];
        for (const url of options.referenceImageUrls!) {
          try {
            log.info(
              `[generateImage] Fetching reference image from URL: ${url}`,
            );
            const resp = await fetch(url);
            if (!resp.ok) {
              throw new Error(`HTTP error ${resp.status} fetching ${url}`);
            }
            const buffer = await resp.buffer();
            const filename =
              url.substring(url.lastIndexOf('/') + 1) || `${uuidv4()}.png`;
            referenceImagesData.push({ filename, buffer });
            log.info(`[generateImage] Fetched reference image: ${filename}`);
          } catch (fetchError) {
            log.error(
              `[generateImage] Failed to fetch reference image from ${url}`,
              fetchError as Error,
            );
            throw new Error(ImageGenerationErrors.FetchReferenceImageFailed);
          }
        }

        let maskBuffer: Buffer | undefined;
        if (options.maskUrl) {
          try {
            log.info(
              `[generateImage] Fetching mask image from URL: ${options.maskUrl}`,
            );
            const resp = await fetch(options.maskUrl);
            if (!resp.ok) {
              throw new Error(
                `HTTP error ${resp.status} fetching mask ${options.maskUrl}`,
              );
            }
            maskBuffer = await resp.buffer();
            log.info(`[generateImage] Fetched mask image.`);
          } catch (fetchError) {
            log.error(
              `[generateImage] Failed to fetch mask image from ${options.maskUrl}`,
              fetchError as Error,
            );
            log.warn(
              '[generateImage] Proceeding without mask due to fetch error.',
            );
          }
        }

        imageResult = await editImageWithOpenAI(
          prompt,
          referenceImagesData,
          openai,
          {
            mask: maskBuffer,
            model: 'gpt-image-1',
            n: options.n,
            size: options.size as
              | '256x256'
              | '512x512'
              | '1024x1024'
              | undefined,
          },
        );
      } else {
        log.info('[generateImage] Using OpenAI generation endpoint.');
        imageResult = await generateImageWithOpenAI(prompt, openai, {
          model: options.model || 'gpt-image-1',
          n: options.n,
          quality: options.quality as 'low' | 'medium' | 'high' | undefined,
          size: options.size as
            | '1024x1024'
            | '1536x1024'
            | '1024x1536'
            | 'auto'
            | undefined,
        });
      }
    }
  } catch (e) {
    log.error(
      '[generateImage] Error during image generation/editing step',
      e as Error,
    );
    if (
      e instanceof Error &&
      Object.values(ImageGenerationErrors).includes(e.message)
    ) {
      throw e;
    }
    throw new Error(
      useEditEndpoint
        ? ImageGenerationErrors.ImageEditFailure
        : ImageGenerationErrors.ImageGenerationFailure,
    );
  }

  log.info('[generateImage] Generation/Edit successful, preparing upload.', {
    hasUrl: !!imageResult.url,
    hasB64: !!imageResult.b64_json,
  });

  try {
    let imageBuffer: Buffer;
    let contentType = 'image/png';

    if (imageResult.b64_json) {
      log.info('[generateImage] Processing b64_json result.');
      imageBuffer = Buffer.from(imageResult.b64_json, 'base64');
    } else if (imageResult.url) {
      log.info('[generateImage] Processing URL result.');
      const resp = await fetch(imageResult.url);
      if (!resp.ok) {
        throw new Error(
          `Failed to fetch generated image from URL: ${resp.statusText}`,
        );
      }
      imageBuffer = await resp.buffer();
      contentType = resp.headers.get('content-type') || contentType;
    } else {
      throw new Error(
        'No image URL or base64 data received from generation/edit step',
      );
    }

    const compressedBuffer = await compressServerImage(imageBuffer);
    const uploadKey = `${uuidv4()}.png`;
    log.info('[generateImage] Uploading image buffer to S3...', {
      contentType,
      key: uploadKey,
    });
    const { url } = await blobStorage().upload({
      key: uploadKey,
      bucket: 'assets',
      content: compressedBuffer,
      contentType: contentType,
    });
    log.info('[generateImage] S3 upload successful.', { finalUrl: url });
    return url;
  } catch (e) {
    log.error(
      '[generateImage] Error processing or uploading image to S3',
      e as Error,
    );
    throw new Error(ImageGenerationErrors.UploadFailed);
  }
};
