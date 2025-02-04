/* eslint-disable max-len */

import {
  ContestMetadataResponse,
  DEFAULT_CONTEST_BOT_PARAMS,
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
    input: `Hey @commonbot, launch a Best Memes Only contest! Fund it with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Yo @commonbot! Start a Best Memes Only competition—prizes funded by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Letʼs go viral, @commonbot! Initiate Best Memes Only with funds from 0x429ae85883f82203D736e8fc203A455990745ca1 via Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Contest alert: @commonbot, host Best Memes Only! Back it using 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, organize a Best Memes Only showdown! Fuel the prizes with 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Attention @commonbot: Roll out Best Memes Only! Funding address: 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs spark a meme war! Launch Best Memes Only using 0x429ae85883f82203D736e8fc203A455990745ca1 via Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, start Best Memes Only! Fund via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, kick off Best Memes Only! All rewards from 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, host Best Memes Only! Powered by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, assemble a Best Memes Only tournament. Prize pool: 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Letʼs meme! @commonbot, create Best Memes Only using 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, time for Best Memes Only! Fund it through 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Meme lords, assemble! @commonbot, start Best Memes Only via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, launch Best Memes Only now! Backed by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot: Deploy Best Memes Only contest. Funding via 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, letʼs roast some memes! Best Memes Only funded by 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `Breaking News: @commonbot to host Best Memes Only! Funds: 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, activate Best Memes Only! Source funds from 0x429ae85883f82203D736e8fc203A455990745ca1 on Base.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
    },
  },
  {
    input: `@commonbot, start Best Memes Only! Use 0x429ae85883f82203D736e8fc203A455990745ca1 on Base for rewards.`,
    expectedOutput: {
      contestName: 'Best Memes Only',
      ...defaults,
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
