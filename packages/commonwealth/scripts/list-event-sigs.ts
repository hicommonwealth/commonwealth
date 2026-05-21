import { VoteGovernanceAbi } from '@commonxyz/common-governance-abis';
import { getEventSelector, type AbiEvent } from 'viem';

// Filter and process events
const events = VoteGovernanceAbi.filter(
  (item) => item.type === 'event',
) as AbiEvent[];

events.forEach((event) => {
  const inputs = event.inputs
    .map((input) => {
      const indexed = input.indexed ? 'indexed ' : '';
      return `${indexed}${input.type} ${input.name}`;
    })
    .join(', ');

  const signature = `${event.name}(${inputs})`;
  const hash = getEventSelector(event);

  console.log(`Event: ${signature}`);
  console.log(`Hash: ${hash}`);
  console.log('---');
});
