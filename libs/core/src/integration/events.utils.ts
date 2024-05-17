import { ETHERS_BIG_NUMBER, EVM_ADDRESS } from '@hicommonwealth/schemas';
import ethers from 'ethers';
import { ZodSchema, z } from 'zod';
import { EventNames } from './events';
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
  output: Output;
  condition?: (evmInput: ParseSignature<Input>) => boolean;
  mapEvmToSchema: (
    contestAddress: string | null,
    timestamp: Date,
    evmInput: ParseSignature<Input>,
  ) => {
    event_name: EventNames;
    event_payload: z.infer<Output>;
  };
};

export const ChainEventSigs = {
  NewContest:
    'address contest, address namespace, uint256 interval, bool oneOff' as const,
  NewRecurringContestStarted:
    'uint256 indexed contestId, uint256 startTime, uint256 endTime' as const,
  NewSingleContestStarted: 'uint256 startTime, uint256 endTime' as const,
  ContentAdded:
    'uint256 indexed contentId, address indexed creator, string url' as const,
  VoterVoted:
    'address indexed voter, uint256 indexed contentId, uint256 votingPower' as const,
};

const RecurringContestManagerDeployedMapper: EvmMapper<
  typeof ChainEventSigs.NewContest,
  typeof RecurringContestManagerDeployed
> = {
  signature: ChainEventSigs.NewContest,
  output: RecurringContestManagerDeployed,
  condition: (evmInput) => !evmInput.oneOff,
  mapEvmToSchema: (
    contestAddress,
    timestamp,
    { contest, namespace, interval, oneOff: _ },
  ) => ({
    event_name: EventNames.RecurringContestManagerDeployed,
    event_payload: {
      created_at: timestamp,
      contest_address: contest,
      namespace: namespace,
      interval: ethers.BigNumber.from(interval).toNumber(),
    },
  }),
};

const OneOffContestManagerDeployedMapper: EvmMapper<
  typeof ChainEventSigs.NewContest,
  typeof OneOffContestManagerDeployed
> = {
  signature: ChainEventSigs.NewContest,
  output: OneOffContestManagerDeployed,
  condition: (evmInput) => evmInput.oneOff,
  mapEvmToSchema: (
    contestAddress,
    timestamp,
    { contest, namespace, interval, oneOff: _ },
  ) => ({
    event_name: EventNames.OneOffContestManagerDeployed,
    event_payload: {
      created_at: timestamp,
      contest_address: contest,
      namespace: namespace,
      length: ethers.BigNumber.from(interval).toNumber(),
    },
  }),
};

const NewRecurringContestStartedMapper: EvmMapper<
  typeof ChainEventSigs.NewRecurringContestStarted,
  typeof ContestStarted
> = {
  signature: ChainEventSigs.NewRecurringContestStarted,
  output: ContestStarted,
  mapEvmToSchema: (
    contestAddress,
    timestamp,
    { contestId, startTime, endTime },
  ) => ({
    event_name: EventNames.ContestStarted,
    event_payload: {
      created_at: timestamp,
      contest_address: contestAddress!,
      contest_id: ethers.BigNumber.from(contestId).toNumber(),
      start_time: new Date(ethers.BigNumber.from(startTime).toNumber() * 1000),
      end_time: new Date(ethers.BigNumber.from(endTime).toNumber() * 1000),
    },
  }),
};

const NewSingleContestStartedMapper: EvmMapper<
  typeof ChainEventSigs.NewSingleContestStarted,
  typeof ContestStarted
> = {
  signature: ChainEventSigs.NewSingleContestStarted,
  output: ContestStarted,
  mapEvmToSchema: (contestAddress, timestamp, { startTime, endTime }) => ({
    event_name: EventNames.ContestStarted,
    event_payload: {
      created_at: timestamp,
      contest_address: contestAddress!,
      contest_id: 0,
      start_time: new Date(ethers.BigNumber.from(startTime).toNumber() * 1000),
      end_time: new Date(ethers.BigNumber.from(endTime).toNumber() * 1000),
    },
  }),
};

const NewContestContentAddedMapper: EvmMapper<
  typeof ChainEventSigs.ContentAdded,
  typeof ContestContentAdded
> = {
  signature: ChainEventSigs.ContentAdded,
  output: ContestContentAdded,
  mapEvmToSchema: (contestAddress, timestamp, evmInput) => ({
    event_name: EventNames.ContestContentAdded,
    event_payload: {
      created_at: timestamp,
      contest_address: contestAddress!,
      content_id: ethers.BigNumber.from(evmInput.contentId).toNumber(),
      creator_address: evmInput.creator,
      content_url: evmInput.url,
    },
  }),
};

const ContestContentUpvotedMapper: EvmMapper<
  typeof ChainEventSigs.VoterVoted,
  typeof ContestContentUpvoted
> = {
  signature: ChainEventSigs.VoterVoted,
  output: ContestContentUpvoted,
  mapEvmToSchema: (contestAddress, timestamp, evmInput) => ({
    event_name: EventNames.ContestContentUpvoted,
    event_payload: {
      created_at: timestamp,
      contest_address: contestAddress!,
      contest_id: 0, // TODO: oneOff == 0, recurring == ID – Contract must be updated
      content_id: ethers.BigNumber.from(evmInput.contentId).toNumber(),
      voter_address: evmInput.voter,
      voting_power: ethers.BigNumber.from(evmInput.votingPower).toNumber(),
    },
  }),
};

// EvmMappers maps each chain event to one or more zod event schema types
const EvmMappers = {
  NewContest: [
    RecurringContestManagerDeployedMapper,
    OneOffContestManagerDeployedMapper,
  ],
  NewRecurringContestStarted: NewRecurringContestStartedMapper,
  NewSingleContestStarted: NewSingleContestStartedMapper,
  ContentAdded: NewContestContentAddedMapper,
  VoterVoted: ContestContentUpvotedMapper,
};

// parseEthersResult converts the raw EVM result into key-value pairs
// based on solidity event signature.
const parseEthersResult = (
  signature: string,
  evmParsedArgs: ethers.utils.Result,
): Record<string, any> => {
  const sigParts = signature.split(',').map((str: string) => str.trim());
  if (!evmParsedArgs || evmParsedArgs.length !== sigParts.length) {
    throw new Error(
      `evm parsed args does not match signature: (${JSON.stringify(
        evmParsedArgs,
      )}) !== (${signature})`,
    );
  }
  const result: Record<string, any> = {};
  for (let i = 0; i < sigParts.length; i++) {
    const value = evmParsedArgs[i];
    const [, sigArgName] = sigParts[i].replace(' indexed ', ' ').split(' ');
    result[sigArgName] = value;
  }
  return result;
};

// ParserReturnType gets the inferred type for the `output` schema of
// the event. If output is an array, returns a union of all schemas in the array.
type ParserReturnType<Event extends keyof typeof ChainEventSigs> =
  typeof EvmMappers[Event] extends EvmMapper<any, any>
    ? z.infer<typeof EvmMappers[Event]['output']>
    : typeof EvmMappers[Event] extends (infer U)[]
    ? U extends EvmMapper<any, any>
      ? z.infer<U['output']>
      : never
    : never;

// ContestOutboxEvent is the outbox shape
type ContestOutboxEvent<Event extends keyof typeof ChainEventSigs> = {
  event_name: EventNames;
  event_payload: ParserReturnType<Event>;
};

// parseEvmEventToContestEvent maps chain event values to zod schema types
export const parseEvmEventToContestEvent = <
  Event extends keyof typeof ChainEventSigs,
>(
  chainEventName: Event,
  contestAddress: string | null,
  timestamp: Date,
  evmParsedArgs: ethers.utils.Result,
): ContestOutboxEvent<Event> => {
  const m = EvmMappers[chainEventName];
  if (!m) {
    throw new Error(`failed to map EVM event to schema: ${chainEventName}`);
  }
  const mappers: EvmMapper<any, any>[] = Array.isArray(m) ? m : [m];
  for (const mapper of mappers) {
    const evmInput = parseEthersResult(mapper.signature, evmParsedArgs);
    if (!mapper.condition || mapper.condition(evmInput)) {
      return mapper.mapEvmToSchema(contestAddress, timestamp, evmInput);
    }
  }
  throw new Error(`No valid mapper found for event: ${chainEventName}`);
};
