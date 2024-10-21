import { AppError, ServerError, blobStorage } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { uuidv4 } from 'lib/util';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.mjs';
import { type TypedRequestBody, type TypedResponse } from '../types';

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
  RequestFailed: 'failed to generate complete token idea generation',
  IdeaPromptVoilatesSecurityPolicy:
    'provide `ideaPrompt` voilates content security policy',
  ImageGenerationFailure: 'failed to generate image for token idea',
};

// we have to maintain this to have "conversational" context with OpenAI
const convoHistory: (ChatCompletionMessage | ChatCompletionUserMessageParam)[] =
  [];

const chatWithOpenAI = async (prompt = '', openai: OpenAI) => {
  convoHistory.push({ role: 'user', content: prompt }); // user msg

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: convoHistory,
  });
  convoHistory.push(response.choices[0].message); // assistant msg

  return (response.choices[0].message.content || 'NO_RESPONSE').replace(
    /^"|"$/g, // sometimes openAI adds `"` at the start/end of the response + tweaking the prompt also doesn't help
    '',
  );
};

type TokenIdea = {
  name: string;
  symbol: string;
  description: string;
  imageURL: string;
};

type GenerateTokenIdeaReq = {
  ideaPrompt?: string;
};

type GenerateTokenIdeaRes = {
  tokenIdea: TokenIdea;
};

const generateTokenIdea = async (
  models: DB,
  req: TypedRequestBody<GenerateTokenIdeaReq>,
  res: TypedResponse<GenerateTokenIdeaRes>,
) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new AppError(TokenErrors.OpenAINotConfigured);
  }

  const openai = new OpenAI({
    organization:
      process.env.OPENAI_ORGANIZATION || 'org-D0ty00TJDApqHYlrn1gge2Ql',
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!openai) {
    throw new ServerError(TokenErrors.OpenAIInitFailed);
  }

  const ideaPrompt =
    typeof req.body?.ideaPrompt === 'string' ? req.body?.ideaPrompt : undefined;

  const tokenIdea = {
    name: '',
    symbol: '',
    description: '',
    imageURL: '',
  };

  try {
    // required for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Note: name/symbol/description were generated very fast by OpenAI and streaming chunks of text for individual
    // chars of name/symbol/description wasn't proving to be ideal, the FE was receiving chunks way faster, sometimes
    // all chunks in a single buffer. Adjusting buffer size was also not ideal, as the chunks from OpenAI response would
    // contain 2-5 chars max for name/symbol, so we stream full text for name/symbol/description as 3 seperate chunks
    // and them stream the final image matching token info in 2 steps for the client to handle UI updates faster.

    // generate a unique token name
    while (true) {
      tokenIdea.name = await chatWithOpenAI(
        TOKEN_AI_PROMPTS_CONFIG.name(ideaPrompt),
        openai,
      );

      const foundToken = await models.Token.findOne({
        where: {
          name: tokenIdea.name,
        },
      });
      if (!foundToken) break;
    }
    res.write(JSON.stringify(tokenIdea) + '\n');
    res.flush();

    tokenIdea.symbol = await chatWithOpenAI(
      TOKEN_AI_PROMPTS_CONFIG.symbol,
      openai,
    );
    res.write(JSON.stringify(tokenIdea) + '\n');
    res.flush();

    tokenIdea.description = await chatWithOpenAI(
      TOKEN_AI_PROMPTS_CONFIG.description,
      openai,
    );
    res.write(JSON.stringify(tokenIdea) + '\n');
    res.flush();

    // generate image url and send the generated url to the client (to save time on s3 upload)
    const imageResponse = await openai.images.generate({
      prompt: TOKEN_AI_PROMPTS_CONFIG.image(tokenIdea.name, tokenIdea.symbol),
      size: '256x256',
      n: 1,
      response_format: 'url',
    });
    tokenIdea.imageURL = imageResponse.data[0].url || '';
    res.write(JSON.stringify(tokenIdea) + '\n');
    res.flush();

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
    res.write(JSON.stringify(tokenIdea) + '\n');
    res.flush();

    return res.end(
      JSON.stringify({ status: 'success', message: 'stream ended' }) + '\n',
    );
  } catch (e) {
    let error = TokenErrors.RequestFailed;

    if (e?.code === 'content_policy_violation') {
      if (ideaPrompt && !tokenIdea.name) {
        error = TokenErrors.IdeaPromptVoilatesSecurityPolicy;
      } else {
        // this usually happens in the image generation calls
        error = TokenErrors.ImageGenerationFailure;
      }
    }

    return res.end(
      JSON.stringify({ status: 'failure', message: error }) + '\n',
    );
  }
};

export default generateTokenIdea;
