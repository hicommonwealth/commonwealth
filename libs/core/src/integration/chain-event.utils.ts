import { EventNames, EventPairs } from '@hicommonwealth/core';
import { ETHERS_BIG_NUMBER, EVM_ADDRESS } from '@hicommonwealth/schemas';
import { BigNumber } from 'ethers';
import { decodeLog } from 'web3-eth-abi';
import { z } from 'zod';

/**
 * To add a new chain-event:
 * 1. Add the event signature to EvmEventSignatures
 * 2. Create a Zod schema for the Common equivalent of the parsed event and add it to ChainEventSchemas
 * 3.Add the Event inputs ABI to EvmEventAbis
 * 4. Create a mapping function that implements the EventMapper type
 * 5. Add the new mapper to the EvmMappers object
 */

export const EvmEventSignatures = {
  NamespaceFactory: {
    NamespaceDeployed:
      '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
    ContestManagerDeployed:
      '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693',
  },
  Contests: {
    ContentAdded:
      '0x2f0d66b98c7708890a982e2194479b066a117a6f9a8f418f7f14c6001965b78b',
    RecurringContestStarted:
      '0x32391ebd47fc736bb885d21a45d95c3da80aef6987aa90a5c6e747e9bc755bc9',
    RecurringContestVoterVoted:
      '0x68d40dd5e34d499a209946f8e381c1258bdeff6dea4e96e9ab921da385c03667',
    SingleContestStarted:
      '0x002817006cf5e3f9ac0de6817ca39830ac7e731a4949a59e4ac3c8bef988b20c',
    SingleContestVoterVoted:
      '0xba2ce2b4fab99c4186fd3e0a8e93ffb61e332d0c4709bd01d01e7ac60631437a',
  },
  CommunityStake: {
    Trade: '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
  },
  Launchpad: {
    TokenLaunched:
      '0xd7ca5dc2f8c6bb37c3a4de2a81499b25f8ca8bbb3082010244fe747077d0f6cc',
  },
} as const;

type Values<T> = T[keyof T];
type NestedValues<T> = Values<{ [K in keyof T]: Values<T[K]> }>;
export type EvmEventSignature = NestedValues<typeof EvmEventSignatures>;

// Event Inputs can be found in the contract ABI by filtering the objects by type = 'event' e.g.:
//   for (const obj of abi) {
//     if (obj.type === 'event') console.log(obj)
//   }
// WARN: adding explicit types to this variable breaks DecodedEvmEvent log type for some reason
export const EvmEventAbis = {
  [EvmEventSignatures.CommunityStake.Trade]: [
    {
      name: 'trader',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
    {
      name: 'namespace',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
    {
      name: 'isBuy',
      type: 'bool',
      indexed: false,
      internalType: 'bool',
    },
    {
      name: 'communityTokenAmount',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
    {
      name: 'ethAmount',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
    {
      name: 'protocolEthAmount',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
    {
      name: 'nameSpaceEthAmount',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
    {
      name: 'supply',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
    {
      name: 'exchangeToken',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
  ] as const,
  [EvmEventSignatures.NamespaceFactory.NamespaceDeployed]: [
    {
      name: 'name',
      type: 'string',
      indexed: false,
      internalType: 'string',
    },
    {
      name: '_feeManager',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
    {
      name: '_signature',
      type: 'bytes',
      indexed: false,
      internalType: 'bytes',
    },
    {
      name: '_namespaceDeployer',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
  ] as const,
  [EvmEventSignatures.NamespaceFactory.ContestManagerDeployed]: [
    {
      name: 'contest',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
    {
      name: 'namespace',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
    {
      name: 'interval',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
    {
      name: 'oneOff',
      type: 'bool',
      indexed: false,
      internalType: 'bool',
    },
  ] as const,
  [EvmEventSignatures.Contests.RecurringContestStarted]: [
    {
      name: 'contestId',
      type: 'uint256',
      indexed: true,
      internalType: 'uint256',
    },
    {
      name: 'startTime',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
    {
      name: 'endTime',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
  ] as const,
  [EvmEventSignatures.Contests.SingleContestStarted]: [
    {
      name: 'startTime',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
    {
      name: 'endTime',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
  ] as const,
  [EvmEventSignatures.Contests.ContentAdded]: [
    {
      name: 'contentId',
      type: 'uint256',
      indexed: true,
      internalType: 'uint256',
    },
    {
      name: 'creator',
      type: 'address',
      indexed: true,
      internalType: 'address',
    },
    {
      name: 'url',
      type: 'string',
      indexed: false,
      internalType: 'string',
    },
  ] as const,
  [EvmEventSignatures.Contests.RecurringContestVoterVoted]: [
    {
      name: 'voter',
      type: 'address',
      indexed: true,
      internalType: 'address',
    },
    {
      name: 'contentId',
      type: 'uint256',
      indexed: true,
      internalType: 'uint256',
    },
    {
      name: 'contestId',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
    {
      name: 'votingPower',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
  ] as const,
  [EvmEventSignatures.Contests.SingleContestVoterVoted]: [
    {
      name: 'voter',
      type: 'address',
      indexed: true,
      internalType: 'address',
    },
    {
      name: 'contentId',
      type: 'uint256',
      indexed: true,
      internalType: 'uint256',
    },
    {
      name: 'votingPower',
      type: 'uint256',
      indexed: false,
      internalType: 'uint256',
    },
  ] as const,
  [EvmEventSignatures.Launchpad.TokenLaunched]: [
    {
      name: 'token',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
  ] as const,
};

type AbiTypeToTS<T> = T extends 'address'
  ? z.infer<typeof EVM_ADDRESS>
  : T extends 'uint256'
    ? z.infer<typeof ETHERS_BIG_NUMBER>
    : T extends 'bool'
      ? boolean
      : never;

type Transform<T extends ReadonlyArray<{ name: string; type: string }>> = {
  [K in T[number] as K['name']]: AbiTypeToTS<K['type']>;
};

type DecodedEvmEvent<Signature extends EvmEventSignature> = Transform<
  (typeof EvmEventAbis)[Signature]
>;

// EvmMapper maps chain event args as input to a zod event schema type as output
type EvmMapper<Signature extends EvmEventSignature> = {
  signature: Signature;
  condition?: (obj: DecodedEvmEvent<Signature>) => boolean;
  mapEvmToSchema: (
    contestAddress: string,
    decodedEvmEvent: DecodedEvmEvent<Signature>,
  ) => EventPairs;
};

const RecurringContestManagerDeployedMapper: EvmMapper<
  typeof EvmEventSignatures.NamespaceFactory.ContestManagerDeployed
> = {
  signature: EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
  condition: (evmInput) => !evmInput.oneOff,
  mapEvmToSchema: (
    contestAddress,
    { contest, namespace, interval, oneOff: _ },
  ) => ({
    event_name: EventNames.RecurringContestManagerDeployed,
    event_payload: {
      contest_address: contest,
      namespace: namespace,
      interval: BigNumber.from(interval).toNumber(),
    },
  }),
};

const OneOffContestManagerDeployedMapper: EvmMapper<
  typeof EvmEventSignatures.NamespaceFactory.ContestManagerDeployed
> = {
  signature: EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
  condition: (evmInput) => evmInput.oneOff,
  mapEvmToSchema: (
    contestAddress,
    { contest, namespace, interval, oneOff: _ },
  ) => ({
    event_name: EventNames.OneOffContestManagerDeployed,
    event_payload: {
      contest_address: contest,
      namespace: namespace,
      length: BigNumber.from(interval).toNumber(),
    },
  }),
};

const SingleContestStartedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.SingleContestStarted
> = {
  signature: EvmEventSignatures.Contests.SingleContestStarted,
  mapEvmToSchema: (contestAddress, { startTime, endTime }) => ({
    event_name: EventNames.ContestStarted,
    event_payload: {
      contest_address: contestAddress!,
      contest_id: 0,
      start_time: new Date(BigNumber.from(startTime).toNumber() * 1000),
      end_time: new Date(BigNumber.from(endTime).toNumber() * 1000),
    },
  }),
};

const RecurringContestStartedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.RecurringContestStarted
> = {
  signature: EvmEventSignatures.Contests.RecurringContestStarted,
  mapEvmToSchema: (contestAddress, { contestId, startTime, endTime }) => ({
    event_name: EventNames.ContestStarted,
    event_payload: {
      contest_address: contestAddress!,
      contest_id: BigNumber.from(contestId).toNumber(),
      start_time: new Date(BigNumber.from(startTime).toNumber() * 1000),
      end_time: new Date(BigNumber.from(endTime).toNumber() * 1000),
    },
  }),
};

const ContestContentAddedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.ContentAdded
> = {
  signature: EvmEventSignatures.Contests.ContentAdded,
  mapEvmToSchema: (contestAddress, { contentId, creator, url }) => ({
    event_name: EventNames.ContestContentAdded,
    event_payload: {
      contest_address: contestAddress!,
      content_id: BigNumber.from(contentId).toNumber(),
      creator_address: creator,
      content_url: url,
    },
  }),
};

const RecurringContestContentUpvotedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.RecurringContestVoterVoted
> = {
  signature: EvmEventSignatures.Contests.RecurringContestVoterVoted,
  mapEvmToSchema: (
    contestAddress,
    { contestId, contentId, voter, votingPower },
  ) => ({
    event_name: EventNames.ContestContentUpvoted,
    event_payload: {
      contest_address: contestAddress!,
      contest_id: BigNumber.from(contestId).toNumber(),
      content_id: BigNumber.from(contentId).toNumber(),
      voter_address: voter,
      voting_power: BigNumber.from(votingPower).toString(),
    },
  }),
};

const SingleContestContentUpvotedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.SingleContestVoterVoted
> = {
  signature: EvmEventSignatures.Contests.SingleContestVoterVoted,
  mapEvmToSchema: (contestAddress, { contentId, voter, votingPower }) => ({
    event_name: EventNames.ContestContentUpvoted,
    event_payload: {
      contest_address: contestAddress!,
      contest_id: BigNumber.from(0).toNumber(),
      content_id: BigNumber.from(contentId).toNumber(),
      voter_address: voter,
      voting_power: BigNumber.from(votingPower).toString(),
    },
  }),
};

const EvmMappers: { [key: string]: unknown } = {
  [EvmEventSignatures.NamespaceFactory.NamespaceDeployed]: null,
  [EvmEventSignatures.CommunityStake.Trade]: null,
  [RecurringContestManagerDeployedMapper.signature]: [
    RecurringContestManagerDeployedMapper,
    OneOffContestManagerDeployedMapper,
  ],
  [SingleContestStartedMapper.signature]: SingleContestStartedMapper,
  [RecurringContestStartedMapper.signature]: RecurringContestStartedMapper,
  [ContestContentAddedMapper.signature]: ContestContentAddedMapper,
  [RecurringContestContentUpvotedMapper.signature]:
    RecurringContestContentUpvotedMapper,
  [SingleContestContentUpvotedMapper.signature]:
    SingleContestContentUpvotedMapper,
};

export const parseEvmEvent = (
  contractAddress: string,
  eventSignature: EvmEventSignature,
  data: string,
  topics: string | Array<string>,
) => {
  const m = EvmMappers[eventSignature];
  if (!m) {
    throw new Error(
      `Failed find EvmMapper for event with contract address ${contractAddress} and even signature ${eventSignature}`,
    );
  }
  const mappers: EvmMapper<EvmEventSignature>[] = Array.isArray(m) ? m : [m];
  for (const mapper of mappers) {
    // spread operator removes the Readonly type which decodeLog function does not accept
    const decodedParams = decodeLog(
      [...EvmEventAbis[eventSignature]],
      data,
      topics,
    ) as unknown as DecodedEvmEvent<EvmEventSignature>;
    if (!mapper.condition || mapper.condition(decodedParams)) {
      return mapper.mapEvmToSchema(contractAddress, decodedParams);
    }
  }

  throw new Error(
    `Failed find EvmMapper for event with contract address ${contractAddress} and even signature ${eventSignature}`,
  );
};
