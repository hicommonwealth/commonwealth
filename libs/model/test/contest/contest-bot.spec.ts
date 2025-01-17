import {
  ContestMetadataResponse,
  parseBotCommand,
  ParseBotCommandError,
} from 'model/src/services/openai/parseBotCommand';
import { describe, expect, test } from 'vitest';

type TestCase = {
  input: string;
  expectedOutput: ContestMetadataResponse;
};

const outputA = {
  contestName: 'amazing memez 2025',
  payoutStructure: [33, 33, 34],
  voterShare: 25,
  image_url: 'https://placehold.co/600x400/EEE/31343C',
  tokenAddress: '0x429ae85883f82203D736e8fc203A455990745ca1',
};

const validateOutput = (
  prompt: string,
  expected: ContestMetadataResponse,
  actual: ContestMetadataResponse,
) => {
  const info = JSON.stringify({ prompt, expected, actual }, null, 2);
  expect(actual.contestName, info).to.eq(expected.contestName);
  expect(actual.voterShare, info).to.eq(expected.voterShare);
  expect(actual.image_url, info).to.eq(expected.image_url);
  expect(actual.tokenAddress, info).to.eq(expected.tokenAddress);

  const sum = actual.payoutStructure.reduce((p, acc) => acc + p, 0);
  expect(sum, 'sum must be 100: ' + info).to.eq(100);

  expect(actual.payoutStructure.length, info).to.eq(
    expected.payoutStructure.length,
  );

  // delta can be off by 1 percent if everything adds to 100
  for (let i = 0; i < expected.payoutStructure.length; i++) {
    const expectedPercent = expected.payoutStructure[i];
    const actualPercent = actual.payoutStructure[i];
    const delta = Math.abs(expectedPercent - actualPercent);
    expect(delta, info).to.be.lessThanOrEqual(1);
  }
};

const testCases: Array<TestCase> = [
  {
    input: `hey @contestbot create a contest with the token 0x429ae85883f82203D736e8fc203A455990745ca1 with 25% of prize amount
allocated to voters and a third to each of three winners. The contest title is 'amazing memez 2025'. Use the following image https:
//placehold.co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `hello @contestbot, please create a contest using token 0x429ae85883f82203D736e8fc203A455990745ca1. Allocate 25% to
voters, and split the rest evenly among three winners. Title: 'amazing memez 2025'. Image: https://placehold.
co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `@contestbot start a contest with token 0x429ae85883f82203D736e8fc203A455990745ca1. 25% for voters, one-third each to 3
winners, titled 'amazing memez 2025', image link: https://placehold.co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `hey @commondemo, set up a meme contest called 'amazing memez 2025' using token
0x429ae85883f82203D736e8fc203A455990745ca1. Voters get 25%, three winners get the remainder equally. Image: https:
//placehold.co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `@commondemo please launch a new contest: title = 'amazing memez 2025', token =
0x429ae85883f82203D736e8fc203A455990745ca1, distribution = 25% to voters, 3 winners share the rest equally. Image: https:
//placehold.co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `hello @commondemo create a contest, call it 'amazing memez 2025', use token
0x429ae85883f82203D736e8fc203A455990745ca1. Give voters 25% of the prize. The rest should be split among three winners.
Use image: https://placehold.co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `hey @commondemo I'd like a contest titled 'amazing memez 2025' using 0x429ae85883f82203D736e8fc203A455990745ca1. 25%
for voters, 1/3 each for 3 winners, pic at https://placehold.co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `@commondemo create a contest 'amazing memez 2025' with token 0x429ae85883f82203D736e8fc203A455990745ca1. Allocate
25% to voters, the remainder among 3 winners equally, image: https://placehold.co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `@commondemo, can you set up a new meme contest? Title: 'amazing memez 2025' Token address:
0x429ae85883f82203D736e8fc203A455990745ca1. 25% goes to voters, the rest is divided by 3 winners. Image link: https://placehold.co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `hey @commondemo, start the contest named 'amazing memez 2025' with the token
0x429ae85883f82203D736e8fc203A455990745ca1. The voters get 25%. Three winners split the remainder. Use this image: https:
//placehold.co/600x400/EEE/31343C`,
    expectedOutput: outputA,
  },
  {
    input: `“Hey @commondemo, please start a new contest titled ‘Best Meme Battle 2025’. Use token
0xA1B2c3D4e5F6789012345678901234567890AbCd on Base. The total prize goes to 3 winners: 25% to winner #1, 35% to winner
#2, and 40% to winner #3. Include this image: https://placehold.co/600x400/EEE/31343C”`,
    expectedOutput: {
      ...outputA,
      contestName: 'Best Meme Battle 2025',
      payoutStructure: [25, 35, 40],
      voterShare: 0,
      tokenAddress: '0xA1B2c3D4e5F6789012345678901234567890AbCd',
    },
  },
  {
    input: `@commondemo create a brand-new contest: Title ‘High-Stakes Talent Hunt 2025’, Token
0xABC1234567890abcdEf0123456789ABCDEF120345 on Base. 3 winners: 10% goes to winner one, 20% to winner two, 70% to
winner three. Image: https://placehold.co/600x400/EEE/31343C`,
    expectedOutput: {
      ...outputA,
      contestName: 'High-Stakes Talent Hunt 2025',
      payoutStructure: [10, 20, 70],
      voterShare: 0,
      tokenAddress: '0xABC1234567890abcdEf0123456789ABCDEF120345',
    },
  },
  {
    input: `Hello @commondemo! I want a contest named ‘Unreal Art Clash 2025’ using
0xabCDef012345678901234567890123456789AbCdE on Base. Please award 3 winners with 20%, 30%, and 50% of the prize
respectively. Use https://placehold.co/600x400/EEE/31343C as the image.”`,
    expectedOutput: {
      ...outputA,
      contestName: 'Unreal Art Clash 2025',
      payoutStructure: [20, 30, 50],
      voterShare: 0,
      tokenAddress: '0xabCDef012345678901234567890123456789AbCdE',
    },
  },
  {
    input: `@commondemo I’d like to launch ‘Grand Innovation Pitch 2025’ using token 0x9Abc0123Def4567890123456abCDEf7890123456
on Base. Three winners share the pot: 15%, 35%, and 50%. Please attach image https://placehold.co/600x400/EEE/31343C.”`,
    expectedOutput: {
      ...outputA,
      contestName: 'Grand Innovation Pitch 2025',
      payoutStructure: [15, 35, 50],
      voterShare: 0,
      tokenAddress: '0x9Abc0123Def4567890123456abCDEf7890123456',
    },
  },
  {
    input: `Hey @commonlocal, begin a contest titled ‘Meme Royal Rumble 2025’ The token is
0x3456Ef1234AbCDE7890123456789abcdefABCDEF0 on Base. Distribute prize among three winners with 33%, 22%, and 45%.
Here’s the image: https://placehold.co/600x400/EEE/31343C”`,
    expectedOutput: {
      ...outputA,
      contestName: 'Meme Royal Rumble 2025',
      payoutStructure: [33, 22, 45],
      voterShare: 0,
      tokenAddress: '0x3456Ef1234AbCDE7890123456789abcdefABCDEF0',
    },
  },
];

// verifies that the correct error is thrown given a malformed prompt
const testFailureCase = async (
  prompt: string,
  expectedErrorMessage: string,
) => {
  const info = JSON.stringify({ prompt, expectedErrorMessage }, null, 2);
  try {
    await parseBotCommand(prompt);
    expect(false, 'prompt was supposed to fail: ' + info).to.be.true;
  } catch (err) {
    expect(err, info).instanceOf(ParseBotCommandError);
    expect((err as ParseBotCommandError).getPrettyError(), info).to.eq(
      expectedErrorMessage,
    );
  }
};

describe('Parse Bot Command', () => {
  test('Expected failure cases', async () => {
    if (!process.env.TEST_LLM) {
      console.warn(
        'LLM test is skipped. Add env TEST_LLM=true to run the test.',
      );
      return;
    }
    await testFailureCase(
      `hey wasup @contestbot make me breakfast`,
      ParseBotCommandError.ERRORS.NoResponse,
    );
    await testFailureCase(
      `hey @contestbot, make a contest for token 0x123 with prize distributed to 3 winners equally`,
      ParseBotCommandError.ERRORS.InvalidParams,
    );
  });
  test('Expected happy cases', async () => {
    if (!process.env.TEST_LLM) {
      console.warn(
        'LLM test is skipped. Add env TEST_LLM=true to run the test.',
      );
      return;
    }
    await Promise.all(
      testCases.map(async (testCase) => {
        const response = await parseBotCommand(testCase.input);
        validateOutput(testCase.input, testCase.expectedOutput, response);
      }),
    );
  });
});
