/* eslint-disable max-len */

import {
  ContestMetadataResponse,
  DEFAULT_VOTER_SHARE,
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

// TODO: ENABLE ALL TESTS
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
      voterShare: DEFAULT_VOTER_SHARE,
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
      voterShare: DEFAULT_VOTER_SHARE,
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
      voterShare: DEFAULT_VOTER_SHARE,
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
      voterShare: DEFAULT_VOTER_SHARE,
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
      voterShare: DEFAULT_VOTER_SHARE,
      tokenAddress: '0x3456Ef1234AbCDE7890123456789abcdefABCDEF0',
    },
  },
  {
    input: `Hey @commondemo, let's start "Summer Splash Contest" with token 0xAAAA1111. Make 100% go to one winner. Use
this image: https://placehold.co/600x400/EEE/31343C`,
    expectedOutput: {
      contestName: 'Summer Splash Contest',
      payoutStructure: [100],
      voterShare: DEFAULT_VOTER_SHARE,
      image_url: 'https://placehold.co/600x400/EEE/31343C',
      tokenAddress: '0xAAAA1111',
    },
  },
  {
    input: `@commondemo run a contest named "Farcaster Fun" with token 0xFA123456. We want 10% for voters, and 90% for
  one champion. Use https://example.com/farcaster.png`,
    expectedOutput: {
      contestName: 'Farcaster Fun',
      payoutStructure: [90, 5, 5],
      voterShare: 10,
      image_url: 'https://example.com/farcaster.png',
      tokenAddress: '0xFA123456',
    },
  },
  {
    input: `Hello @commondemo, set up "Trivia Time" using token 0xBEEFBEEF. 20% to voters, 80% to one winner. Pic link:
  https://placehold.it/400x300`,
    expectedOutput: {
      contestName: 'Trivia Time',
      payoutStructure: [80, 10, 10],
      voterShare: 20,
      image_url: 'https://placehold.it/400x300',
      tokenAddress: '0xBEEFBEEF',
    },
  },
  //   {
  //     input: `@commondemo let's do "Meme Rush" with 0xFFFEEE. Allocate 25% to voters, 75% to a single winner. Use https:
  // //picsum.photos/400`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo kindly create "Crypto Art Showdown" with token 0xART123. No voter share, 3 winners splitting 100%.
  // Image: https://example.org/art.jpg`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo I'd like to run "Halloween Giveaway" using 0xDEAD9999. 50% to voters, 2 winners with 25% each.
  // The image is https://picsum.photos/seed/halloween/500/400`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Hey @commondemo, new contest "Funny Cats" with token 0xCAT. 2 winners, each gets 40%, and 20% for voters. Pic:
  // https://example.com/cat.png`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Start "Hack Week Challenge" @commondemo with 0xHACK123. 30% voters, 7 winners at 10% each. Image: https:
  // //picsum.photos/600/300`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo please host "Winter Wonderland" with token 0xWINT1234. One winner gets it all (100%). Use https:
  // //placeholder.com/600`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo let's call this "Spring Fling" using 0xSPRING. 10% to voters, 3 winners each 30%. Link: https:
  // //placehold.it/350x250`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Hey @commondemo create "Crypto Marathon" with token 0xMARATHON. Split 50% for voters, 50% for a single
  // winner. Image: https://example.org/marathon.jpg`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo new contest: "Best Meme 2025" using 0xMEME2025. 25% goes to voters, 3 winners each get 25%.
  // Use https://placekitten.com/400/300`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo let's spin up "NFT Raffle" with token 0xNFT123. 2 winners: 50% each, no voter reward. Image link:
  // https://placehold.co/400x200`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Please create "Open Source Awards" @commondemo using 0xOPEN1111. 40% for voters, 6 winners share 60%
  // equally. Pic: https://picsum.photos/400/200`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo new game: "Lucky Numbers" with 0xLUCKY7777. 30% to voters, 7 winners with 10% each. Image:
  // https://example.com/lucky.png`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Hey @commondemo, contest name "Zk Tech Challenge" using token 0xZKTECH. 100% to one winner. Image: https:
  // //picsum.photos/200`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo let's do "DAO Celebration" with 0xDAO222. 20% to voters, 80% to one winner. Use https://myimages.
  // com/dao.jpg`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo I'd like "DeFi Derby" with token 0xDEFI1234. 10 winners get 10% each. No voter split. Image: https:
  // //picsum.photos/id/101/400`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo set up "Protocol Party" with 0xPROTO. 15% to voters, 3 winners each 28.3333%. Pic: https:
  // //placeholder.com/protocol.jpg`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Hey @commondemo, run "Web3 Wizards" with token 0xW3WIZ. One winner, 100%. Image: https://placehold.
  // co/600x400/EEE/333`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo create "Gaming Gala" using token 0xGAME111. 25% for voters, 75% for a single winner. Image link:
  // https://picsum.photos/400/250`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Start "Token Bash" @commondemo with 0xBASH9. 50% to voters, 5 winners each get 10%. Use https://example.
  // com/bash.png`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo I'd like "Solidity Showdown" with 0xSOLID999. 5% voters, 5 winners at 19%. Pic: https://picsum.
  // photos/300`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Hey @commondemo, call it "Metaverse Mania" with token 0xMETA888. 33% to voters, 2 winners with 33% each.
  // Image: https://myhost.com/meta.jpg`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo please host "Layer 2 Launch" using 0xL20002. 40% voters, 2 winners 30% each. The image is https:
  // //example.com/l2.png`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo let's do "Yield Farming Fiesta" with token 0xYIELD123. 10 winners at 10% each. Pic: https://picsum.
  // photos/seed/fiesta/300/200`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Create "Cross-Chain Craze" @commondemo using 0xCCHAIN. 25% voters, 3 winners each 25%. Image link: https:
  // //placeholder.com/ccraze.jpg`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Hey @commondemo, launch "Scaling Summit" with token 0xSCALING. 20% for voters, 4 winners each at 20%. Use
  // https://picsum.photos/id/202/400/300`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo set up "Sidechain Show" with 0xSIDE123. 1 winner gets everything. Pic: https://example.org/side.png`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Hello @commondemo, create "MultiSig Madness" using 0xMULT999. 30% voters, 2 winners each 35%. Image: https:
  // //picsum.photos/400`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo new contest "Graph Protocol Giveaway" with token 0xGRAPH. 50% voters, 5 winners 10% each.
  // Image: https://picsum.photos/seed/graph/400`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo let's call it "Validator Victory" using 0xVALID8. 25% voters, 3 winners each 25%. Link: https:
  // //placeholder.com/valid.jpg`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo I'd like "Rollup Royale" with token 0xROLL999. 100% single winner. Use this image: https://picsum.
  // photos/id/33/600`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Hey @commondemo, please host "API Adventures" with 0xAPIAPI. 10% voters, 3 winners with 30%. Pic: https:
  // //example.com/api.jpg`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo create "Coding Crusade" with token 0xCODEX777. 20% to voters, 2 winners splitting 40% each.
  // Image: https://picsum.photos/id/1010/400`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo I'd love "Smart Contract Showcase" using 0xSC1234. 15% voters, 5 winners with 17% each. Image:
  // https://placeholder.com/scshow.jpg`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo run "Fork Fest" with 0xFORKFEST. 5% voters, 3 winners each 31.6667%. Pic: https://picsum.
  // photos/300/300`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `Hi @commondemo, start "DX Drop" with token 0xDXDX. 50% to voters, 5 winners at 10% each. Use https://example.
  // org/dxdrop.png`,
  //     expectedOutput: {},
  //   },
  //   {
  //     input: `@commondemo create "Liquidity Lottery" using 0xLIQ123. 8 winners, each gets 12.5%. Pic: https://picsum.
  // photos/seed/liqlott/400`,
  //     expectedOutput: {},
  //   },
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
  // TODO: REMOVE SKIP
  test.skip('Expected failure cases', async () => {
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
