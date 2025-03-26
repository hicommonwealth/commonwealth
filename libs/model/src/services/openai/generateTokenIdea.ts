import { blobStorage } from '@hicommonwealth/core';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.mjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { models } from '../../database';
import { LaunchpadTokenInstance } from '../../models/token';
import { compressServerImage } from '../../utils/imageCompression';

type GenerateTokenIdeaProps = {
  ideaPrompt?: string;
};

const TOKEN_AI_PROMPTS_CONFIG = {
  name: (ideaPrompt?: string) => `
      Please ${ideaPrompt ? `use this prompt in quotation "${ideaPrompt}" to ` : ''}
      create a random idea for a memecoin cryptocurrency, have the token name informed by current events, 
      and historical internet based humor. Make it hyper opinionated and subversive or topical. Provide just the 
      token name without any acronym or symbol. Make it either cringe or amazing. Restrict your answer to between 
      6 and 25 characters.
    `,
  symbol: `
      Create a symbol for this token (symbol) of 3-6 characters. The symbol should not include special characters 
      or emojis. Restrict your answer to between 3 and 6 characters.`,
  description: `
      Provide a description for the token. Make it funny and keep it in the vein of ironic, sardonic, twitter personae.
      There are no emoji restrictions. Keep the description to 2 sentences. DO NOT BE OVERLY POSITIVE about global 
      phenomenon, only the asset itself. Restrict your answer to between 1 or 2 sentences and less than 180 characters.
    `,
  image: (name: string, symbol: string) => `
      Please create an image for a web3 token called "${name}" with symbol "${symbol}". 
    `,
};

const TokenErrors = {
  OpenAINotConfigured: 'OpenAI key not configured',
  OpenAIInitFailed: 'OpenAI initialization failed',
  RequestFailed: 'failed to generate complete token idea',
  IdeaPromptVoilatesSecurityPolicy:
    'provided `ideaPrompt` voilates content security policy',
  ImageGenerationFailure: 'failed to generate image for token idea',
  RunwareNotConfigured: 'Runware API key not configured',
};

// we have to maintain this to have "conversational" context with OpenAI
const convoHistory: (ChatCompletionMessage | ChatCompletionUserMessageParam)[] =
  [];

const chatWithOpenAI = async (prompt = '', openai: OpenAI) => {
  console.log('Sending prompt to OpenAI:', prompt);
  convoHistory.push({ role: 'user', content: prompt }); // user msg

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: convoHistory,
  });
  convoHistory.push(response.choices[0].message); // assistant msg

  const result = (response.choices[0].message.content || 'NO_RESPONSE').replace(
    /^"|"$/g, // sometimes openAI adds `"` at the start/end of the response + tweaking the prompt also doesn't help
    '',
  );
  console.log('Received response from OpenAI:', result);
  return result;
};

const generateImageWithRunware = async (prompt: string) => {
  console.log('Generating token image with Runware model: runware:100@1');
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
    console.error('Runware API error:', error);
    throw error;
  }

  const data = await response.json();
  console.log('Successfully generated token image with Runware', data);
  return data.data[0].imageURL;
};

const generateImageWithOpenAI = async (prompt: string, openai: OpenAI) => {
  console.log('Generating token image with OpenAI model: dall-e-3');
  const imageResponse = await openai.images.generate({
    prompt,
    size: '1024x1024',
    model: 'dall-e-3',
    n: 1,
    response_format: 'url',
  });
  console.log('Successfully generated token image with OpenAI');
  return imageResponse.data[0].url || '';
};

const generateTokenIdea = async function* ({
  ideaPrompt,
}: GenerateTokenIdeaProps): AsyncGenerator {
  if (!config.OPENAI.API_KEY) {
    console.error(TokenErrors.OpenAINotConfigured);
    yield { error: TokenErrors.OpenAINotConfigured };
    return;
  }

  const openai = new OpenAI({
    organization: config.OPENAI.ORGANIZATION,
    apiKey: config.OPENAI.API_KEY,
  });

  if (!openai) {
    console.error(TokenErrors.OpenAIInitFailed);
    yield { error: TokenErrors.OpenAIInitFailed };
    return;
  }

  let tokenName = '';
  try {
    // generate a unique token name
    let foundToken: LaunchpadTokenInstance | boolean | null = true;
    while (foundToken) {
      tokenName = await chatWithOpenAI(
        TOKEN_AI_PROMPTS_CONFIG.name(ideaPrompt),
        openai,
      );

      foundToken = await models.LaunchpadToken.findOne({
        where: {
          name: tokenName,
        },
      });
    }

    yield 'event: name\n';
    yield `data: ${tokenName}\n\n`;

    const tokenSymbol = await chatWithOpenAI(
      TOKEN_AI_PROMPTS_CONFIG.symbol,
      openai,
    );

    yield 'event: symbol\n';
    yield `data: ${tokenSymbol}\n\n`;

    const tokenDescription = await chatWithOpenAI(
      TOKEN_AI_PROMPTS_CONFIG.description,
      openai,
    );

    yield 'event: description\n';
    yield `data: ${tokenDescription}\n\n`;

    // generate image url and send the generated url to the client (to save time on s3 upload)
    let imageUrl: string;
    console.log(
      `Using image generation service: ${config.IMAGE_GENERATION.FLAG_USE_RUNWARE ? 'Runware' : 'OpenAI'}`,
    );

    if (config.IMAGE_GENERATION.FLAG_USE_RUNWARE) {
      if (!config.IMAGE_GENERATION.RUNWARE_API_KEY) {
        throw new Error(TokenErrors.RunwareNotConfigured);
      }
      imageUrl = await generateImageWithRunware(
        TOKEN_AI_PROMPTS_CONFIG.image(tokenName, tokenSymbol),
      );
    } else {
      imageUrl = await generateImageWithOpenAI(
        TOKEN_AI_PROMPTS_CONFIG.image(tokenName, tokenSymbol),
        openai,
      );
    }

    // upload image to s3 and then send finalized imageURL
    console.log('Uploading generated image to S3');
    const resp = await fetch(imageUrl);
    const buffer = await resp.buffer();
    const compressedBuffer = await compressServerImage(buffer);
    const { url } = await blobStorage().upload({
      key: `${uuidv4()}.png`,
      bucket: 'assets',
      content: compressedBuffer,
      contentType: 'image/png',
    });
    console.log('Successfully uploaded image to S3:', url);

    yield 'event: imageURL\n';
    yield `data: ${url}\n\n`;
  } catch (e) {
    console.error('Error in generateTokenIdea:', e);
    let error = TokenErrors.RequestFailed;

    if (
      e instanceof OpenAI.APIError &&
      e?.code === 'content_policy_violation'
    ) {
      if (ideaPrompt && !tokenName) {
        error = TokenErrors.IdeaPromptVoilatesSecurityPolicy;
      } else {
        error = TokenErrors.ImageGenerationFailure;
      }
    }

    yield { error };
  }
};

export { generateTokenIdea };
