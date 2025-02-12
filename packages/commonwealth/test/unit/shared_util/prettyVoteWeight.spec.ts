import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { expect } from 'chai';
import { prettyVoteWeight } from 'shared/adapters/currency';
import { describe, test } from 'vitest';

describe('prettyVoteWeight', () => {
  test('erc20 and native ETH', () => {
    expect(
      prettyVoteWeight('0', TopicWeightedVoting.ERC20),
      'handle zero',
    ).to.eq('0');

    expect(
      prettyVoteWeight('1000000000000000000', TopicWeightedVoting.ERC20),
      'handle 1 with 18-decimals',
    ).to.eq('1');

    expect(
      prettyVoteWeight('5123000000000000000', TopicWeightedVoting.ERC20),
      'handle > 1 with 18 decimals',
    ).to.eq('5.123');

    expect(
      prettyVoteWeight('5123000000000000000', TopicWeightedVoting.ERC20, 2),
      'multiply > 1',
    ).to.eq('10.246');

    expect(
      prettyVoteWeight('5123000000000000000', TopicWeightedVoting.ERC20, 0.5),
      'multiply < 1',
    ).to.eq('2.5615');

    expect(
      prettyVoteWeight(
        '5123000000000000000',
        TopicWeightedVoting.ERC20,
        0.5,
        2,
      ),
      'two decimal places',
    ).to.eq('2.56');

    expect(
      prettyVoteWeight(
        '5123000000000000000',
        TopicWeightedVoting.ERC20,
        0.5,
        0,
      ),
      'zero decimal places',
    ).to.eq('3');

    expect(
      prettyVoteWeight('5123456700000000000', TopicWeightedVoting.ERC20, 1, 7),
      'seven decimal places',
    ).to.eq('5.1234567');

    expect(
      prettyVoteWeight('5123000000000000000', TopicWeightedVoting.ERC20, 1, 7),
      'seven decimal places with trailing zeros truncated',
    ).to.eq('5.123');

    expect(
      prettyVoteWeight('5000000000000', TopicWeightedVoting.ERC20),
      'small number',
    ).to.eq('0.000005');

    expect(
      prettyVoteWeight('500000000000', TopicWeightedVoting.ERC20),
      'really small number',
    ).to.eq('0.0…');

    expect(
      prettyVoteWeight('100', TopicWeightedVoting.ERC20),
      'tiny number',
    ).to.eq('0.0…');
  });

  test('stake', () => {
    expect(
      prettyVoteWeight('0', TopicWeightedVoting.Stake),
      'handle zero',
    ).to.eq('0');

    expect(
      prettyVoteWeight('1', TopicWeightedVoting.Stake),
      'handle one',
    ).to.eq('1');

    expect(
      prettyVoteWeight('72', TopicWeightedVoting.Stake),
      'handle > 1',
    ).to.eq('72');

    expect(
      prettyVoteWeight('7', TopicWeightedVoting.Stake, 2),
      'multiply > 1',
    ).to.eq('14');

    expect(
      prettyVoteWeight('20', TopicWeightedVoting.Stake, 0.5),
      'multiply < 1',
    ).to.eq('10');
  });
});
