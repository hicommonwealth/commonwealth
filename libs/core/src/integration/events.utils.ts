import { ETHERS_BIG_NUMBER, EVM_ADDRESS } from '@hicommonwealth/schemas';
import ethers from 'ethers';
import { ZodSchema, z } from 'zod';
import {
  ContestContentAdded,
  ContestContentUpvoted,
  ContestStarted,
  OneOffContestManagerDeployed,
  RecurringContestManagerDeployed,
} from './events.schemas';

// ParseType maps an EVM type to a TS type
type ParseType<T> = T extends 'address'
  ? z.infer<typeof EVM_ADDRESS>
  : T extends 'uint256'
  ? z.infer<typeof ETHERS_BIG_NUMBER>
  : T extends 'bool'
  ? boolean
  : never;

// RemoveIndexed removes "indexed" arg name
type RemoveIndexed<T extends string> = T extends `indexed ${infer Suffix}`
  ? `${Suffix}`
  : T;

// ParseSignature converts solidity event args into a typed record
type ParseSignature<S extends string> =
  S extends `${infer Type} ${infer Name}, ${infer Rest}`
    ? { [K in RemoveIndexed<Name>]: ParseType<Type> } & ParseSignature<Rest>
    : S extends `${infer Type} ${infer Name}`
    ? { [K in RemoveIndexed<Name>]: ParseType<Type> }
    : any;

// EvmMapper maps chain event args as input to a zod event schema type as output
type EvmMapper<Input extends string, Output extends ZodSchema> = {
  signature: Input;
  condition?: (evmInput: ParseSignature<Input>) => boolean;
  mapEvmToSchema: (evmInput: ParseSignature<Input>) => z.infer<Output>;
};

const ChainEventSigs = {
  NewContest:
    'address contest, address namespace, uint256 interval, bool oneOff' as const,
  NewRecurringContestStarted:
    'uint256 indexed contestId, uint256 startTime, uint256 endTime' as const,
  NewSingleContestStarted: 'uint256 startTime, uint256 endTime' as const,
  ContentAdded:
    'uint256 indexed contentId, address indexed creator, string url' as const,
  VoterVoted:
    'address indexed voter, uint256 indexed contentId, uint256 votingPower' as const,
  PrizeShareUpdated: 'uint256 newPrizeShare' as const,
};

const RecurringContestManagerDeployedMapper: EvmMapper<
  typeof ChainEventSigs.NewContest,
  typeof RecurringContestManagerDeployed
> = {
  signature: ChainEventSigs.NewContest,
  condition: (evmInput) => !evmInput.oneOff,
  mapEvmToSchema: (evmInput) => ({
    created_at: new Date(),
    contest_address: evmInput.contest,
    content_id: 0, // TODO optional
    namespace: evmInput.namespace,
    interval: ethers.BigNumber.from(evmInput.interval).toNumber(),
  }),
};

const OneOffContestManagerDeployedMapper: EvmMapper<
  typeof ChainEventSigs.NewContest,
  typeof OneOffContestManagerDeployed
> = {
  signature: ChainEventSigs.NewContest,
  condition: (evmInput) => evmInput.oneOff,
  mapEvmToSchema: (evmInput) => ({
    created_at: new Date(),
    contest_address: evmInput.contest,
    content_id: 0, // TODO optional
    namespace: evmInput.namespace,
    length: 0, // TODO: NewContest event does not have length (has interval)
  }),
};

const NewRecurringContestStartedMapper: EvmMapper<
  typeof ChainEventSigs.NewRecurringContestStarted,
  typeof ContestStarted
> = {
  signature: ChainEventSigs.NewRecurringContestStarted,
  mapEvmToSchema: (evmInput) => ({
    created_at: new Date(),
    contest_address: '', // TODO
    contest_id: 0, // TODO optional
    start_time: new Date(ethers.BigNumber.from(evmInput.startTime).toNumber()),
    end_time: new Date(ethers.BigNumber.from(evmInput.startTime).toNumber()),
  }),
};

const NewSingleContestStartedMapper: EvmMapper<
  typeof ChainEventSigs.NewSingleContestStarted,
  typeof ContestStarted
> = {
  signature: ChainEventSigs.NewSingleContestStarted,
  mapEvmToSchema: (evmInput) => ({
    created_at: new Date(),
    contest_address: '', // TODO
    contest_id: 0, // TODO optional
    start_time: new Date(ethers.BigNumber.from(evmInput.startTime).toNumber()),
    end_time: new Date(ethers.BigNumber.from(evmInput.startTime).toNumber()),
  }),
};

const NewContestContentAddedMapper: EvmMapper<
  typeof ChainEventSigs.ContentAdded,
  typeof ContestContentAdded
> = {
  signature: ChainEventSigs.ContentAdded,
  mapEvmToSchema: (evmInput) => ({
    created_at: new Date(),
    contest_address: '', // TODO
    content_id: ethers.BigNumber.from(evmInput.contentId).toNumber(),
    creator_address: evmInput.creator,
    content_url: evmInput.url,
  }),
};

const ContestContentUpvotedMapper: EvmMapper<
  typeof ChainEventSigs.VoterVoted,
  typeof ContestContentUpvoted
> = {
  signature: ChainEventSigs.VoterVoted,
  mapEvmToSchema: (evmInput) => ({
    created_at: new Date(),
    contest_address: '', // TODO
    contest_id: 0, // TODO
    content_id: ethers.BigNumber.from(evmInput.contentId).toNumber(),
    voter_address: evmInput.voter,
    voting_power: ethers.BigNumber.from(evmInput.votingPower).toNumber(),
  }),
};

type EvmMappersRecord = {
  [K in keyof typeof ChainEventSigs]: EvmMapper<any, any>[];
};

// EvmMappers maps each chain event to one or more zod event schema types
const EvmMappers: EvmMappersRecord = {
  NewContest: [
    RecurringContestManagerDeployedMapper,
    OneOffContestManagerDeployedMapper,
  ],
  NewRecurringContestStarted: [NewRecurringContestStartedMapper],
  NewSingleContestStarted: [NewSingleContestStartedMapper],
  ContentAdded: [NewContestContentAddedMapper],
  VoterVoted: [ContestContentUpvotedMapper],
  PrizeShareUpdated: [],
};

// parseEthersResult converts the raw EVM result into key-value pairs based on signature.
// The raw EVM result values should already be typed (string, boolean, BigNumber)
const parseEthersResult = (
  signature: string,
  params: ethers.utils.Result,
): Record<string, any> => {
  const sigParts = signature.split(',').map((str: string) => str.trim());
  const result: Record<string, any> = {};
  for (let i = 0; i < sigParts.length; i++) {
    const value = params[i];
    const [, sigArgName] = sigParts[i].split(' ');
    result[sigArgName] = value;
  }
  return result;
};

// mapEvmToSchema maps chain event values to
const mapEvmToSchema = (
  chainEventName: keyof typeof ChainEventSigs,
  evmValues: ethers.utils.Result,
): any => {
  const mappers = EvmMappers[chainEventName];
  if (!mappers) {
    throw new Error(`failed to map EVM event to schema: ${chainEventName}`);
  }
  for (const mapper of mappers) {
    const evmInput = parseEthersResult(mapper.signature, evmValues);
    if (!mapper.condition || mapper.condition(evmInput)) {
      return mapper.mapEvmToSchema(evmInput);
    }
  }
};
