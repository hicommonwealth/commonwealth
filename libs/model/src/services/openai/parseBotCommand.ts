import { OpenAI } from 'openai';
import {
  ChatCompletionDeveloperMessageParam,
  ChatCompletionTool,
} from 'openai/resources/index.mjs';
import { config } from '../../config';

export const USDC_BASE_MAINNET_ADDRESS =
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const USDC_BASE_SEPOLIA_ADDRESS =
  '0x5dEaC602762362FE5f135FA5904351916053cF70';

export const DEFAULT_CONTEST_BOT_PARAMS = {
  payoutStructure: [50, 30, 20],
  voterShare: 10,
  image_url:
    'https://assets.commonwealth.im/42b9d2d9-79b8-473d-b404-b4e819328ded.png',
};

export type ContestMetadataResponse = {
  contestName: string;
  payoutStructure: number[];
  voterShare: number;
  image_url: string;
  tokenAddress: string;
  isUSDC: boolean;
};

const system_prompt: ChatCompletionDeveloperMessageParam = {
  role: 'developer',
  content: `
    You are a data extraction system that extracts information from the user.

    The user will ask to "launch", "start", "create", etc. That means they want to launch a contest.

    Extract the name of the contest as well as the token address from the user prompt.
    contestName is the name of the contest.
    tokenAddress is the ethereum address of the funding token.
    isUSDC should be set to true if the user shows intent to launch with the USDC token.

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

    Example: "@contestbot, launch Base Bangers on USDC"
    Expected Output:
    {
      contestName: "Diamond Handz",
      isUSDC: true
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
          isUSDC: { type: 'boolean' },
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

export const getContestUSDCAddress = () => {
  if (config.APP_ENV === 'production') {
    return USDC_BASE_MAINNET_ADDRESS;
  }
  return USDC_BASE_SEPOLIA_ADDRESS;
};

// TODO: Update to use OpenAI StructuredOutputs instead of manually parsing
// TODO: Generalize
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

  if (!data.contestName || !(data.tokenAddress || data.isUSDC)) {
    throw new ParseBotCommandError('InvalidParams');
  }

  const tokenAddress = data.isUSDC
    ? getContestUSDCAddress()
    : data.tokenAddress;

  return {
    contestName: data.contestName,
    tokenAddress,
    ...DEFAULT_CONTEST_BOT_PARAMS,
    isUSDC: data.isUSDC,
  };
};
