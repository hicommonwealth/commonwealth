import { logger } from '@hicommonwealth/core';
import { OpenAI } from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.mjs';
import { config } from '../../config';
import { models } from '../../database';
import { LaunchpadTokenInstance } from '../../models/token';
import {
  generateImage,
  ImageGenerationErrors,
} from '../../utils/generateImage';

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
      There are no emoji restrictions. You don't have to say 'introducing' or 'new token'. Keep the description to 1 sentence. DO NOT BE OVERLY POSITIVE about global 
      phenomenon, only the asset itself. Restrict your answer to between 1 sentences and less than 180 characters.
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
};

// we have to maintain this to have "conversational" context with OpenAI
const convoHistory: (ChatCompletionMessage | ChatCompletionUserMessageParam)[] =
  [];

const log = logger(import.meta);

const chatWithOpenAI = async (prompt = '', openai: OpenAI) => {
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
  return result;
};

const generateTokenIdea = async function* ({
  ideaPrompt,
}: GenerateTokenIdeaProps): AsyncGenerator {
  if (!config.OPENAI.API_KEY) {
    log.error(TokenErrors.OpenAINotConfigured);
    yield { error: TokenErrors.OpenAINotConfigured };
  }

  const openai = new OpenAI({
    organization: config.OPENAI.ORGANIZATION,
    apiKey: config.OPENAI.API_KEY,
  });

  if (!openai) {
    log.error(TokenErrors.OpenAIInitFailed);
    yield { error: TokenErrors.OpenAIInitFailed };
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
    const imageUrl = await generateImage(
      TOKEN_AI_PROMPTS_CONFIG.image(tokenName, tokenSymbol),
      openai,
      {
        model: 'runware:100@1',
      },
    );

    yield 'event: imageURL\n';
    yield `data: ${imageUrl}\n\n`;
  } catch (e) {
    log.error('Error in generateTokenIdea', e as Error);
    let error = TokenErrors.RequestFailed;

    if (
      e instanceof OpenAI.APIError &&
      e?.code === 'content_policy_violation'
    ) {
      if (ideaPrompt && !tokenName) {
        error = TokenErrors.IdeaPromptVoilatesSecurityPolicy;
      } else {
        error = ImageGenerationErrors.ImageGenerationFailure;
      }
    }

    yield { error };
  }
};

export { generateTokenIdea };
