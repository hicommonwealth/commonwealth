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
  content: `you are a data extraction system to understand intents of the following style of message: \n
    "hey @contestbot create a contest with the token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, 
    with 20% of prize amount allocated to voters and the rest going to one winner. 
    The contest title is “Submit your best artwork for our token”.
    Use the following image https://test.com/test.png" \n
    This message should result in the following parameters: \n
    {
"contestName": "Submit your best artwork for our token",
  "payoutStructure": [100],
  "voterShare": 20,
  "image_url": "https://test.com/test.png",
  "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
}`,
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

  const data = JSON.parse(
    response.choices[0].message.tool_calls![0].function.arguments,
  );

  return {
    contestName: data.contestName,
    payoutStructure: data.payoutStructure,
    voterShare: data.voterShare,
    image_url: data.image_url,
    tokenAddress: data.tokenAddress,
  };
};
