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

type TokenIdea = {
  name: string;
  symbol: string;
  description: string;
  imageURL: string;
};

type GenerateTokenIdeaProps = {
  ideaPrompt?: string;
};

type GenerateTokenIdeaResponse = {
  tokenIdea?: TokenIdea;
  error?: string;
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
      There are no emoji restrictions. Keep the description to 3 sentences. DO NOT BE OVERLY POSITIVE about global 
      phenomenon, only the asset itself. Restrict your answer to between 1 and 3 sentences and less than 180 characters.
    `,
  image: (name: string, symbol: string) => `
      Please create an image for a web3 token named "${name}", having a symbol of "${symbol}". 
    `,
};

const TokenErrors = {
  OpenAINotConfigured: 'OpenAI key not configured',
  OpenAIInitFailed: 'OpenAI initialization failed',
  RequestFailed: 'failed to generate complete token idea',
  IdeaPromptVoilatesSecurityPolicy:
    'provided `ideaPrompt` voilates content security policy',
  ImageGenerationFailure: 'failed to generate image for token idea',
};

// we have to maintain this to have "conversational" context with OpenAI
const convoHistory: (ChatCompletionMessage | ChatCompletionUserMessageParam)[] =
  [];

const chatWithOpenAI = async (prompt = '', openai: OpenAI) => {
  convoHistory.push({ role: 'user', content: prompt }); // user msg

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: convoHistory,
  });
  convoHistory.push(response.choices[0].message); // assistant msg

  return (response.choices[0].message.content || 'NO_RESPONSE').replace(
    /^"|"$/g, // sometimes openAI adds `"` at the start/end of the response + tweaking the prompt also doesn't help
    '',
  );
};

const generateTokenIdea = async function* ({
  ideaPrompt,
}: GenerateTokenIdeaProps): AsyncGenerator<
  GenerateTokenIdeaResponse,
  void,
  unknown
> {
  if (!config.OPENAI.API_KEY) {
    yield { error: TokenErrors.OpenAINotConfigured };
  }

  const openai = new OpenAI({
    organization: config.OPENAI.ORGANIZATION,
    apiKey: config.OPENAI.API_KEY,
  });

  if (!openai) {
    yield { error: TokenErrors.OpenAIInitFailed };
  }

  const tokenIdea = {
    name: '',
    symbol: '',
    description: '',
    imageURL: '',
  };

  try {
    // generate a unique token name
    let foundToken: LaunchpadTokenInstance | boolean | null = true;
    while (foundToken) {
      tokenIdea.name = await chatWithOpenAI(
        TOKEN_AI_PROMPTS_CONFIG.name(ideaPrompt),
        openai,
      );

      foundToken = await models.LaunchpadToken.findOne({
        where: {
          name: tokenIdea.name,
        },
      });
      if (!foundToken) break;
    }
    yield { tokenIdea };

    tokenIdea.symbol = await chatWithOpenAI(
      TOKEN_AI_PROMPTS_CONFIG.symbol,
      openai,
    );
    yield { tokenIdea };

    tokenIdea.description = await chatWithOpenAI(
      TOKEN_AI_PROMPTS_CONFIG.description,
      openai,
    );
    yield { tokenIdea };

    // generate image url and send the generated url to the client (to save time on s3 upload)
    const imageResponse = await openai.images.generate({
      prompt: TOKEN_AI_PROMPTS_CONFIG.image(tokenIdea.name, tokenIdea.symbol),
      size: '256x256',
      model: 'dall-e-2',
      n: 1,
      response_format: 'url',
    });
    tokenIdea.imageURL = imageResponse.data[0].url || '';
    yield { tokenIdea };

    // upload image to s3 and then send finalized imageURL
    const resp = await fetch(tokenIdea.imageURL);
    const buffer = await resp.buffer();
    const { url } = await blobStorage().upload({
      key: `${uuidv4()}.png`,
      bucket: 'assets',
      content: buffer,
      contentType: 'image/png',
    });
    tokenIdea.imageURL = url;
    yield { tokenIdea };
  } catch (e) {
    let error = TokenErrors.RequestFailed;

    if (
      e instanceof OpenAI.APIError &&
      e?.code === 'content_policy_violation'
    ) {
      if (ideaPrompt && !tokenIdea.name) {
        error = TokenErrors.IdeaPromptVoilatesSecurityPolicy;
      } else {
        // this usually happens in the image generation calls
        error = TokenErrors.ImageGenerationFailure;
      }
    }

    yield { error };
  }
};

export { generateTokenIdea };
