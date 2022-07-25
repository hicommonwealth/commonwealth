/* eslint-disable @typescript-eslint/no-explicit-any */
import { Contract, utils } from 'ethers';

import { GovernorCompatibilityBravo } from '../../../contractTypes';
import { TypedEventFilter } from '../../../contractTypes/commons';
import { CWEvent, SupportedNetwork } from '../../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';

type GetEventArgs<T> = T extends TypedEventFilter<infer Y, any> ? Y : never;
type GetArgType<
  C extends Contract,
  Name extends keyof C['filters']
> = GetEventArgs<ReturnType<C['filters'][Name]>>;

export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.ProposalCanceled: {
      const [id] = rawData.args as GetArgType<
        GovernorCompatibilityBravo,
        'ProposalCanceled'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Compound,
        data: {
          kind,
          id: id.toHexString(),
        },
      };
    }
    case EventKind.ProposalCreated: {
      // workaround to switch description decoding to "bytes" in order to
      // avoid unicode decoding errors involving invalid codepoints
      // to reproduce: try the uniswap governor alpha
      // also works around the "results" field being unqueryable using the TypedEvent
      const result = utils.defaultAbiCoder.decode(
        [
          'uint',
          'address',
          'address[]',
          'uint[]',
          'string[]',
          'bytes[]',
          'uint',
          'uint',
          'bytes',
        ],
        rawData.data
      );
      const [
        id,
        proposer,
        targets,
        values,
        signatures,
        calldatas,
        startBlock,
        endBlock,
        descriptionBytes,
      ] = result;
      const description = utils.toUtf8String(
        descriptionBytes,
        utils.Utf8ErrorFuncs.ignore
      );

      return {
        blockNumber,
        excludeAddresses: [proposer],
        network: SupportedNetwork.Compound,
        data: {
          kind,
          id: id.toHexString(),
          proposer,
          targets,
          values: values.map((v) => v.toString()),
          signatures,
          calldatas: calldatas.map((c) => utils.hexlify(c)),
          startBlock: +startBlock,
          endBlock: +endBlock,
          description,
        },
      };
    }
    case EventKind.ProposalExecuted: {
      const [id] = rawData.args as GetArgType<
        GovernorCompatibilityBravo,
        'ProposalExecuted'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Compound,
        data: {
          kind,
          id: id.toHexString(),
        },
      };
    }
    case EventKind.ProposalQueued: {
      const [id, eta] = rawData.args as GetArgType<
        GovernorCompatibilityBravo,
        'ProposalQueued'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Compound,
        data: {
          kind,
          id: id.toHexString(),
          eta: +eta,
        },
      };
    }
    case EventKind.VoteCast: {
      const [
        voter,
        proposalId,
        support,
        votes,
        reason, // should be undefined in GovAlpha version
      ] = rawData.args as GetArgType<GovernorCompatibilityBravo, 'VoteCast'>;
      return {
        blockNumber,
        excludeAddresses: [voter],
        network: SupportedNetwork.Compound,
        data: {
          kind,
          voter,
          id: proposalId.toHexString(),
          support: +support,
          votes: votes.toString(),
          reason,
        },
      };
    }
    default: {
      throw new Error(`Unknown event kind: ${kind}`);
    }
  }
}
