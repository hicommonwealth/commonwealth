/* eslint-disable max-len */

import {
  ContestMetadataResponse,
  DEFAULT_CONTEST_BOT_PARAMS,
  getContestUSDCAddress,
  parseBotCommand,
  ParseBotCommandError,
} from 'model/src/services/openai/parseBotCommand';
import { describe, expect, test } from 'vitest';

type TestCase = {
  input: string;
  expectedOutput: ContestMetadataResponse;
};

const defaults: Omit<ContestMetadataResponse, 'contestName'> = {
  tokenAddress: '0x429ae85883f82203D736e8fc203A455990745ca1',
  ...DEFAULT_CONTEST_BOT_PARAMS,
  isUSDC: false,
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
  expect(actual.payoutStructure, info).to.eq(expected.payoutStructure);
};

// TODO: ENABLE ALL TESTS
const testCases: Array<TestCase> = [
  {
    input: `Hey @commonbot, launch a Best Memes Only contest! Fund it with 0x5e2d3f1a8b9c0d7e6f1a2b3c4d5e6f7a8b9c0d1e on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x5e2d3f1a8b9c0d7e6f1a2b3c4d5e6f7a8b9c0d1e',
    },
  },
  {
    input: `Yo @commonbot! Start a Best Memes Only competition—prizes funded by 0x3a4b5c6d7e8f90123456789abcdef0123456789a on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x3a4b5c6d7e8f90123456789abcdef0123456789a',
    },
  },
  {
    input: `Letʼs go viral, @commonbot! Initiate Best Memes Only with funds from 0x3a4b5c6d7e8f90123456789abcdef0123456789a via Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x3a4b5c6d7e8f90123456789abcdef0123456789a',
    },
  },
  {
    input: `Contest alert: @commonbot, host Best Memes Only! Back it using 0x1029384756abcdef89fedcba5647382910abcde5 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x1029384756abcdef89fedcba5647382910abcde5',
    },
  },
  {
    input: `@commonbot, organize a Best Memes Only showdown! Fuel the prizes with 0x89abcdef0123456789abcdef0123456789abcdef on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x89abcdef0123456789abcdef0123456789abcdef',
    },
  },
  {
    input: `Attention @commonbot: Roll out Best Memes Only! Funding address: 0xfedcba9876543210fedcba9876543210fedcba98 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    },
  },
  {
    input: `@commonbot, letʼs spark a meme war! Launch Best Memes Only using 0x13579bdf2468ace013579bdf2468ace013579bdf via Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x13579bdf2468ace013579bdf2468ace013579bdf',
    },
  },
  {
    input: `@commonbot, start Best Memes Only! Fund via 0x2468ace013579bdf2468ace013579bdf2468ace0 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x2468ace013579bdf2468ace013579bdf2468ace0',
    },
  },
  {
    input: `@commonbot, kick off Best Memes Only! All rewards from 0xdeadbeefcafebabe8badf00dfeedfacefeedb00c on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0xdeadbeefcafebabe8badf00dfeedfacefeedb00c',
    },
  },
  {
    input: `@commonbot, host Best Memes Only! Powered by 0x0123abcd4567ef890123abcd4567ef890123abcd on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x0123abcd4567ef890123abcd4567ef890123abcd',
    },
  },
  {
    input: `@commonbot, assemble a Best Memes Only tournament. Prize pool: 0x89ab67cd45ef23cd89ab67cd45ef23cd89ab67cd on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x89ab67cd45ef23cd89ab67cd45ef23cd89ab67cd',
    },
  },
  {
    input: `Letʼs meme! @commonbot, create Best Memes Only using 0xfedc1234ba9876edc1234ba9876edc1234ba9876 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0xfedc1234ba9876edc1234ba9876edc1234ba9876',
    },
  },
  {
    input: `@commonbot, time for Best Memes Only! Fund it through 0x11223344556677889900aabbccddeeff11223344 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x11223344556677889900aabbccddeeff11223344',
    },
  },
  {
    input: `Meme lords, assemble! @commonbot, start Best Memes Only via 0x5566778899aabbccddeeff001122334455667788 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x5566778899aabbccddeeff001122334455667788',
    },
  },
  {
    input: `@commonbot, launch Best Memes Only now! Backed by 0x5566778899aabbccddeeff001122334455667788 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x5566778899aabbccddeeff001122334455667788',
    },
  },
  {
    input: `@commonbot: Deploy Best Memes Only contest. Funding via 0x99aabbccddeeff00112233445566778899aabbcc on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x99aabbccddeeff00112233445566778899aabbcc',
    },
  },
  {
    input: `@commonbot, letʼs roast some memes! Best Memes Only funded by 0xa1b2c3d4e5f60718293a4b5c6d7e8f9012b3c4d5 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012b3c4d5',
    },
  },
  {
    input: `Breaking News: @commonbot to host Best Memes Only! Funds: 0xa1b2c3d4e5f60718293a4b5c6d7e8f9012b3c4d5 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012b3c4d5',
    },
  },
  {
    input: `@commonbot, activate Best Memes Only! Source funds from 0xffeeddccbbaa00998877665544332211ffeeddcc on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0xffeeddccbbaa00998877665544332211ffeeddcc',
    },
  },
  {
    input: `@commonbot, start Best Memes Only! Use 0x0a0b0c0d0e0f1a1b1c1d1e1f2a2b2c2d3a3b3c3d on Base for rewards.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x0a0b0c0d0e0f1a1b1c1d1e1f2a2b2c2d3a3b3c3d',
    },
  },
  {
    input: `@commonbot, letʼs get spicy—create Best Memes Only! Fund with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Calling all meme creators: @commonbot launches Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base!`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, initiate Best Memes Only! Prize pool: 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Go! @commonbot, fire up Best Memes Only! Fueled by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs make memes legendary! Fund Best Memes Only with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, roll out Best Memes Only! Use 0x429ae85883f82203D736e8fc203A455990745ca1 on Base for the vault.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, launch Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs crown meme royalty! start Best Memes Only funded by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Hey @commonbot, unleash Best Memes Only! Back it with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, spin up Best Memes Only! Rewards from 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, time to shine! Host Best Memes Only with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs go bananas 🍌! Start Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `To @commonbot: Launch Best Memes Only! Prize address: 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, assemble the meme army! Fund Best Memes Only with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, initiate Best Memes Only! Use 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Letʼs do this, @commonbot! Create Best Memes Only using 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, time to flex those meme skills! Fund Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Code Red: @commonbot, deploy Best Memes Only! Funds: 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs make it rain memes! Best Memes Only powered by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Urgent: @commonbot, start Best Memes Only! Backed by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Petition: @commonbot, host Best Memes Only! Use 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs go viral or go home! Best Memes Only with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Meme HQ @commonbot, launch Best Memes Only! Funds via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, prep the stage! Best Memes Only contest funded by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs fuel the memeconomy! Start Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Attention @commonbot: Best Memes Only contest incoming! Funded by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, rally creators for Best Memes Only! Pool: 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Meme enthusiasts unite! @commonbot, launch Best Memes Only using 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs turn up the meme heat! Fund Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Operation Laughter: @commonbot, initiate Best Memes Only! Funds on Base: 0x429ae85883f82203D736e8fc203A455990745ca1.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs make memes trend! Best Memes Only funded by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, start the meme marathon! Use 0x429ae85883f82203D736e8fc203A455990745ca1 on Base for rewards.`,
    expectedOutput: {
      contestName: 'meme marathon',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs dominate the memeverse! Fund Best Memes Only with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, time to flex creativity! Launch Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, assemble the meme council! Best Memes Only funded by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs make history! Best Memes Only contest via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, unleash the meme storm! Use 0x429ae85883f82203D736e8fc203A455990745ca1 on Base for funding.`,
    expectedOutput: {
      contestName: 'meme storm',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs go global! Best Memes Only funded by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs get legendary! Start Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, rally the community! Best Memes Only funded by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs break records! Launch Best Memes Only with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs go big or go home! Spin up Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, time to innovate! Fund Best Memes Only with 0x3ecced5b416e58664f04a39dd18935eb71d33b15 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x3ecced5b416e58664f04a39dd18935eb71d33b15',
    },
  },
  {
    input: `@commonbot, letʼs inspire laughter! Best Memes Only contest via 0x0c41f1fc9022feb69af6dc666abfe73c9ffda7ce on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: '0x0c41f1fc9022feb69af6dc666abfe73c9ffda7ce',
    },
  },
  {
    input: `@commonbot, letʼs inspire laughter! Best Memes Only contest via USDC on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
      tokenAddress: getContestUSDCAddress(),
      isUSDC: true,
    },
  },
  {
    input: `@contestbot, launch Super Friday for usdc.`,
    expectedOutput: {
      contestName: 'Super Friday',
      ...defaults,
      tokenAddress: getContestUSDCAddress(),
      isUSDC: true,
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
      `hey @contestbot, wasup`,
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
