import { blobStorage, logger } from '@hicommonwealth/core';
import type { ImageGenerationModel } from '@hicommonwealth/shared';
import { Buffer } from 'buffer';
import fetch from 'node-fetch';
import OpenAI, { toFile } from 'openai';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  try {
    // Convert buffer to File-like object using toFile helper, explicitly setting type
    const imageFile = await toFile(
      referenceImagesData[0].buffer,
      referenceImagesData[0].filename || 'reference.png',
      { type: 'image/png' }, // Specify the MIME type
    );

    const payload: OpenAI.Images.ImageEditParams = {
      image: imageFile,
      prompt,
      model: options.model || 'gpt-image-1',
      n: options.n || 1,
      size: options.size || '1024x1024',
    };

    // Add mask if provided, converting it using toFile with explicit type
    if (options.mask) {
      payload.mask = await toFile(
        options.mask,
        'mask.png',
        { type: 'image/png' }, // Specify the MIME type
      );
    }

    log.info('[editImageWithOpenAI] Calling OpenAI edit API with', {
      prompt,
      model: payload.model,
      hasImage: true, // We know image exists due to check above
      hasMask: !!payload.mask,
    });

    // Use the OpenAI SDK to handle the request formatting
    const imageResponse = await openai.images.edit(payload);
    log.info('[editImageWithOpenAI] OpenAI API response received.');

    return { b64_json: imageResponse.data[0].b64_json || '' };
  } catch (error) {
    // Convert to standard Error object
    const errorObj = error instanceof Error ? error : new Error(String(error));
    log.error('[editImageWithOpenAI] OpenAI API call failed.', errorObj);

    // Log parameters for debugging
    const params = {
      prompt,
      model: options.model || 'gpt-image-1',
      size: options.size || '1024x1024',
      hasReferenceImage: referenceImagesData.length > 0,
      hasMask: !!options.mask,
    };
    log.info('[editImageWithOpenAI] Parameters used in failed call:', params);

    throw new Error(ImageGenerationErrors.ImageEditFailure);
  }
};

export const generateImage = async (
  prompt: string,
  openai?: OpenAI,
  options: {
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
  } = {},
) => {
  const useEditEndpoint =
    options.referenceImageUrls && options.referenceImageUrls.length > 0;

  // --- Model selection logic ---
  // If model starts with 'runware', use Runware. Otherwise, use OpenAI.
  const model = options.model || 'gpt-image-1';
  const isRunwareModel = model.toLowerCase().startsWith('runware');
  const isOpenAIModel = !isRunwareModel;

  if (isRunwareModel) {
    if (!config.IMAGE_GENERATION.RUNWARE_API_KEY) {
      throw new Error(
        ImageGenerationErrors.RunwareNotConfigured +
          ': Runware model requested but API key is missing.',
      );
    }
    if (useEditEndpoint) {
      throw new Error(
        'Runware does not support image editing with reference images.',
      );
    }
  } else {
    // OpenAI path
    if (!config.OPENAI.API_KEY) {
      throw new Error(
        ImageGenerationErrors.OpenAINotConfigured +
          ': OpenAI model requested but API key is missing.',
      );
    }
    if (!openai) {
      throw new Error(ImageGenerationErrors.OpenAIInitFailed);
    }
  }

  let imageResult: { url?: string; b64_json?: string };
  try {
    if (isRunwareModel && !useEditEndpoint) {
      log.info('[generateImage] Using Runware for generation.');
      const runwareUrl = await generateImageWithRunware(prompt);
      imageResult = { url: runwareUrl };
    } else if (isOpenAIModel) {
      log.info('[generateImage] Using OpenAI for generation.');
      if (useEditEndpoint) {
        log.info(
          '[generateImage] Using OpenAI edits endpoint with reference images.',
        );
        if (!openai) {
          throw new Error(ImageGenerationErrors.OpenAIInitFailed);
        }
        const referenceImagesData: { filename: string; buffer: Buffer }[] = [];
        for (const url of options.referenceImageUrls || []) {
          try {
            log.info(
              `[generateImage] Fetching reference image from URL: ${url}`,
            );
            const response = await fetch(url);
            if (!response.ok) {
              log.error(
                `[generateImage] Failed to fetch reference image from URL: ${url}`,
              );
              throw new Error(ImageGenerationErrors.FetchReferenceImageFailed);
            }
            const buffer = await response.buffer();
            referenceImagesData.push({
              filename: url.split('/').pop() || 'reference.png',
              buffer,
            });
          } catch (fetchError) {
            const errorObj =
              fetchError instanceof Error
                ? fetchError
                : new Error(String(fetchError));
            log.error(
              `[generateImage] Error fetching reference image from URL: ${url}`,
              errorObj,
            );
            throw new Error(ImageGenerationErrors.FetchReferenceImageFailed);
          }
        }

        const maskBuffer = options.maskUrl
          ? await fetch(options.maskUrl).then((res) => res.buffer())
          : undefined;
        imageResult = await editImageWithOpenAI(
          prompt,
          referenceImagesData,
          openai,
          {
            mask: maskBuffer,
            model: model,
            n: options.n,
            size:
              options.size === '256x256' ||
              options.size === '512x512' ||
              options.size === '1024x1024'
                ? options.size
                : '1024x1024',
          },
        );
      } else {
        log.info('[generateImage] Using OpenAI generation endpoint.');
        if (!openai) {
          throw new Error(ImageGenerationErrors.OpenAIInitFailed);
        }
        imageResult = await generateImageWithOpenAI(prompt, openai, {
          model: model,
          n: options.n,
          quality: (options.quality === 'standard' || options.quality === 'hd'
            ? 'high'
            : options.quality) as 'low' | 'medium' | 'high' | undefined,
          size: options.size as
            | '1024x1024'
            | '1536x1024'
            | '1024x1536'
            | 'auto'
            | undefined,
        });
      }
    } else {
      throw new Error(
        'Invalid model/backend combination or unsupported operation.',
      );
    }
  } catch (e) {
    log.error(
      '[generateImage] Error during image generation/editing step',
      e instanceof Error ? e : new Error(String(e)),
    );
    throw new Error(ImageGenerationErrors.ImageGenerationFailure);
  }

  log.info('[generateImage] Generation/Edit successful, preparing upload.', {
    hasUrl: !!imageResult.url,
    hasB64: !!imageResult.b64_json,
  });

  try {
    let imageBuffer: Buffer;
    let contentType = 'image/png'; // Default to png

    if (imageResult.b64_json) {
      log.info('[generateImage] Processing b64_json result.');
      imageBuffer = Buffer.from(imageResult.b64_json, 'base64');
    } else if (imageResult.url) {
      log.info('[generateImage] Processing URL result (fetching buffer).');
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
      e instanceof Error ? e : new Error(String(e)),
    );
    throw new Error(ImageGenerationErrors.UploadFailed);
  }
};
