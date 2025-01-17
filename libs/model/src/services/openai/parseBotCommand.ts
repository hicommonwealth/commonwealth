import { OpenAI } from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionTool,
} from 'openai/resources/index.mjs';
import { config } from '../../config';

export type ContestMetadataResponse = {
  contestName: string;
  payoutStructure: number[];
  voterShare: number;
  image_url: string;
  tokenAddress: string;
};

const system_prompt: ChatCompletionMessage = {
  role: 'assistant',
  content: `
    You are a data extraction system to understand intents of the following style of message: \n
    "hey @contestbot create a contest with the token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,
    with 20% of prize amount allocated to voters and the rest going to two winners.
    Winner #1 should have 75% while winner #2 has 25%.
    The contest title is “Submit your best artwork for our token”.
    Use the following image https://test.com/test.png" \n
    This message should result in the following parameters: \n
    {
      "contestName": "Submit your best artwork for our token",
      "payoutStructure": [75, 25],
      "voterShare": 20,
      "image_url": "https://test.com/test.png",
      "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    }
    \n
    The payoutStructure refers to the percentage given to each winner and its values must always add up to 100.
    Any mention of dividing equally refers to the payoutStructure.
    Any mention of shares, allocation or distribution to voters should be assigned to the voterShare
    which is independent of payoutStructure.
    `,
};

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'parse_data',
      parameters: {
        type: 'object',
        properties: {
          contestName: { type: 'string' },
          payoutStructure: { type: 'array', items: { type: 'number' } },
          voterShare: { type: 'number' },
          image_url: { type: 'string' },
          tokenAddress: { type: 'string' },
        },
      },
    },
  },
];

// Custom error type that returns a human-readable error intended for end users
export class ParseBotCommandError extends Error {
  static ERRORS = {
    NoResponse: 'Failed to create contest. Verify your prompt or try again.',
    InvalidParams:
      'Failed to create contest. Specify all contest parameters: winners, prize distribution to voters, title, image and token address.',
  } as const;

  constructor(message: keyof typeof ParseBotCommandError.ERRORS) {
    super(message);
    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  getPrettyError(): string {
    return (
      ParseBotCommandError.ERRORS[
        this.message as keyof typeof ParseBotCommandError.ERRORS
      ] || 'An unknown error occurred.'
    );
  }
}

export const parseBotCommand = async (
  command: string,
): Promise<ContestMetadataResponse> => {
  const openai = new OpenAI({
    organization: config.OPENAI.ORGANIZATION,
    apiKey: config.OPENAI.API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      system_prompt,
      {
        role: 'user',
        content: command,
      },
    ],
    tools,
  });

  let data = null;
  try {
    data = JSON.parse(
      response.choices[0].message.tool_calls![0].function.arguments,
    );
  } catch (err) {
    throw new ParseBotCommandError('NoResponse');
  }

  // if payout structure has any remainder under 100, give it to first winner
  if (!data.payoutStructure.length) {
    throw new ParseBotCommandError('InvalidParams');
  }
  const payoutStructure: Array<number> = data.payoutStructure.map((n: number) =>
    Math.floor(n),
  );
  const sum = payoutStructure.reduce((p, acc) => acc + p, 0);
  if (sum < 100) {
    const remainder = 100 - sum;
    payoutStructure[0] += remainder;
  }

  if (!data.contestName || !data.image_url || !data.tokenAddress) {
    throw new ParseBotCommandError('InvalidParams');
  }

  return {
    contestName: data.contestName,
    payoutStructure,
    voterShare: data.voterShare || 0,
    image_url: data.image_url,
    tokenAddress: data.tokenAddress,
  };
};
