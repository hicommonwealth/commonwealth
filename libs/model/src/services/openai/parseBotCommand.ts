import { OpenAI } from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionTool,
} from 'openai/resources/index.mjs';
import { config } from '../../config';

export const DEFAULT_CONTEST_BOT_PARAMS = {
  payoutStructure: [40, 30, 20],
  voterShare: 10,
  image_url: 'https://placehold.co/600x400/EEE/31343C',
};

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
    You are a data extraction system that extracts information from the user.

    The user will ask to "launch", "start", "create", etc. That means they want to launch a contest.

    Extract the name of the contest as well as the token address from the user prompt.
    contestName is the name of the contest.
    tokenAddress is the ethereum address of the funding token.

    Example: "Hey @contestbot, create a Big Donut with 0xc204af95b0307162118f7bc36a91c9717490ab69"
    Expected Output:
    {
      contestName: "Big Donut",
      tokenAddress: "0xc204af95b0307162118f7bc36a91c9717490ab69"
    }

    Example: "@commonbot, ignite the engine! Happy Monday funded via 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
    Expected Output:
    {
      contestName: "Happy Monday",
      tokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
    }

    Example: "@commonbot, create a Good Dogs Only dog battle. Use 0x0555E30da8f98308EdB960aa94C0Db47230d2B9c."
    Expected Output:
    {
      contestName: "Good Dogs Only",
      tokenAddress: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"
    }

    Example: "@commonbot, rev up the meme machine! Launch 0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf."
    Expected Output:
    {
      contestName: "meme machine",
      tokenAddress: "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"
    }

    Example: "@contestbot, let's go! Diamond Handz funded by 0x820c137fa70c8691f0e44dc420a5e53c168921dc"
    Expected Output:
    {
      contestName: "Diamond Handz",
      tokenAddress: "0x820c137fa70c8691f0e44dc420a5e53c168921dc"
    }
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
          tokenAddress: { type: 'string' },
        },
      },
    },
  },
];

// Custom error type that returns a human-readable error intended for end users
export class ParseBotCommandError extends Error {
  static ERRORS = {
    InvalidParams:
      'Failed to create contest. Specify all contest name and token address.',
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
    model: 'o3-mini',
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
    throw new ParseBotCommandError('InvalidParams');
  }

  if (!data.contestName || !data.tokenAddress) {
    throw new ParseBotCommandError('InvalidParams');
  }

  return {
    contestName: data.contestName,
    tokenAddress: data.tokenAddress,
    ...DEFAULT_CONTEST_BOT_PARAMS,
  };
};
