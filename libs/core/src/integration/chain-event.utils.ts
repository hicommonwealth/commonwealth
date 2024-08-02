import {
  CommunityStakeTrade,
  ContestContentAdded,
  ContestContentUpvoted,
  ContestStarted,
  EventNames,
  NamespaceDeployed,
  OneOffContestManagerDeployed,
  RecurringContestManagerDeployed,
} from '@hicommonwealth/core';
import ethers from 'ethers';
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
} as const;

type Values<T> = T[keyof T];
type NestedValues<T> = Values<{ [K in keyof T]: Values<T[K]> }>;
export type EvmEventSignature = NestedValues<typeof EvmEventSignatures>;

type ChainEventSchemas =
  | typeof ContestContentUpvoted
  | typeof ContestContentAdded
  | typeof ContestStarted
  | typeof OneOffContestManagerDeployed
  | typeof RecurringContestManagerDeployed
  | typeof CommunityStakeTrade
  | typeof NamespaceDeployed;

type AbiEventParameter = {
  name: string;
  type: string;
  indexed: boolean;
  internalType: string;
};

// Event Inputs can be found in the contract ABI by filtering the objects by type = 'event'.
export const EvmEventAbis: Record<
  EvmEventSignature,
  Array<AbiEventParameter>
> = {
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
  ],
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
  ],
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
  ],
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
  ],
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
  ],
  // single contest ContentAdded signature is the same as recurring contest ContentAdded signature
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
  ],
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
  ],
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
  ],
} as const;

// TODO: add type
type DecodedEvmEvent<S> = any;

// EvmMapper maps chain event args as input to a zod event schema type as output
type EvmMapper<
  Signature extends EvmEventSignature,
  Schema extends ChainEventSchemas,
> = {
  signature: Signature;
  output: Schema;
  condition?: (obj: any) => any; // TODO: add type
  mapEvmToSchema: (
    contestAddress: string,
    decodedEvmEvent: DecodedEvmEvent<Signature>,
  ) => {
    event_name: EventNames;
    event_payload: z.infer<Schema>;
  };
};

const RecurringContestManagerDeployedMapper: EvmMapper<
  typeof EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
  typeof RecurringContestManagerDeployed
> = {
  signature: EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
  output: RecurringContestManagerDeployed,
  condition: (evmInput) => !evmInput.oneOff,
  mapEvmToSchema: (
    contestAddress,
    { contest, namespace, interval, oneOff: _ },
  ) => ({
    event_name: EventNames.RecurringContestManagerDeployed,
    event_payload: {
      contest_address: contest,
      namespace: namespace,
      interval: ethers.BigNumber.from(interval).toNumber(),
    },
  }),
};

const OneOffContestManagerDeployedMapper: EvmMapper<
  typeof EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
  typeof OneOffContestManagerDeployed
> = {
  signature: EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
  output: OneOffContestManagerDeployed,
  condition: (evmInput) => evmInput.oneOff,
  mapEvmToSchema: (
    contestAddress,
    { contest, namespace, interval, oneOff: _ },
  ) => ({
    event_name: EventNames.OneOffContestManagerDeployed,
    event_payload: {
      contest_address: contest,
      namespace: namespace,
      length: ethers.BigNumber.from(interval).toNumber(),
    },
  }),
};

const SingleContestStartedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.SingleContestStarted,
  typeof ContestStarted
> = {
  signature: EvmEventSignatures.Contests.SingleContestStarted,
  output: ContestStarted,
  mapEvmToSchema: (contestAddress, { contestId, startTime, endTime }) => ({
    event_name: EventNames.ContestStarted,
    event_payload: {
      contest_address: contestAddress!,
      contest_id: ethers.BigNumber.from(contestId).toNumber(),
      start_time: new Date(ethers.BigNumber.from(startTime).toNumber() * 1000),
      end_time: new Date(ethers.BigNumber.from(endTime).toNumber() * 1000),
    },
  }),
};

const RecurringContestStartedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.RecurringContestStarted,
  typeof ContestStarted
> = {
  signature: EvmEventSignatures.Contests.RecurringContestStarted,
  output: ContestStarted,
  mapEvmToSchema: (contestAddress: string, { startTime, endTime }) => ({
    event_name: EventNames.ContestStarted,
    event_payload: {
      contest_address: contestAddress,
      contest_id: 0,
      start_time: new Date(ethers.BigNumber.from(startTime).toNumber() * 1000),
      end_time: new Date(ethers.BigNumber.from(endTime).toNumber() * 1000),
    },
  }),
};

const ContestContentAddedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.ContentAdded,
  typeof ContestContentAdded
> = {
  signature: EvmEventSignatures.Contests.ContentAdded,
  output: ContestContentAdded,
  mapEvmToSchema: (contestAddress, { contentId, creator, url }) => ({
    event_name: EventNames.ContestContentAdded,
    event_payload: {
      contest_address: contestAddress!,
      content_id: ethers.BigNumber.from(contentId).toNumber(),
      creator_address: creator,
      content_url: url,
    },
  }),
};

const RecurringContestContentUpvotedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.RecurringContestVoterVoted,
  typeof ContestContentUpvoted
> = {
  signature: EvmEventSignatures.Contests.RecurringContestVoterVoted,
  output: ContestContentUpvoted,
  mapEvmToSchema: (
    contestAddress,
    { contestId, contentId, voter, votingPower },
  ) => ({
    event_name: EventNames.ContestContentUpvoted,
    event_payload: {
      contest_address: contestAddress!,
      contest_id: ethers.BigNumber.from(contestId).toNumber(),
      content_id: ethers.BigNumber.from(contentId).toNumber(),
      voter_address: voter,
      voting_power: ethers.BigNumber.from(votingPower).toNumber(),
    },
  }),
};

const SingleContestContentUpvotedMapper: EvmMapper<
  typeof EvmEventSignatures.Contests.SingleContestVoterVoted,
  typeof ContestContentUpvoted
> = {
  signature: EvmEventSignatures.Contests.SingleContestVoterVoted,
  output: ContestContentUpvoted,
  mapEvmToSchema: (contestAddress, { contentId, voter, votingPower }) => ({
    event_name: EventNames.ContestContentUpvoted,
    event_payload: {
      contest_address: contestAddress!,
      contest_id: ethers.BigNumber.from(0).toNumber(),
      content_id: ethers.BigNumber.from(contentId).toNumber(),
      voter_address: voter,
      voting_power: ethers.BigNumber.from(votingPower).toNumber(),
    },
  }),
};

const EvmMappers = {
  [EvmEventSignatures.NamespaceFactory.NamespaceDeployed]: {},
  [EvmEventSignatures.CommunityStake.Trade]: {},
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
  const mappers: EvmMapper<any, any>[] = Array.isArray(m) ? m : [m];
  for (const mapper of mappers) {
    const decodedParams = decodeLog(EvmEventAbis[eventSignature], data, topics);
    if (!mapper.condition || mapper.condition(decodedParams)) {
      return mapper.mapEvmToSchema(contractAddress, decodedParams);
    }
  }
};
