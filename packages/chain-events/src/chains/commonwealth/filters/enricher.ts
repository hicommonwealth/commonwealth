/* eslint-disable @typescript-eslint/no-explicit-any */
import { hexToAscii } from 'web3-utils';

import { TypedEventFilter } from '../../../contractTypes/commons';
import {
  ICuratedProjectFactory,
  ICuratedProject,
  // eslint-disable-next-line camelcase
  ICuratedProject__factory,
} from '../../../contractTypes';
import { CWEvent, SupportedNetwork } from '../../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';

type GetEventArgs<T> = T extends TypedEventFilter<any, infer Y> ? Y : never;

type GetArgType<
  Name extends keyof ICuratedProjectFactory['filters']
> = GetEventArgs<ReturnType<ICuratedProjectFactory['filters'][Name]>>;

type GetProjectArgType<
  Name extends keyof ICuratedProject['filters']
> = GetEventArgs<ReturnType<ICuratedProject['filters'][Name]>>;

export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.ProjectCreated: {
      const { projectIndex, projectAddress } = rawData.args as GetArgType<
        'ProjectCreated'
      >;
      const projectContract = ICuratedProject__factory.connect(
        projectAddress,
        api.factory.provider
      );
      const {
        id,
        name,
        ipfsHash,
        url,
        creator,
      } = await projectContract.metaData();
      const {
        threshold,
        deadline,
        beneficiary,
        acceptedToken,
      } = await projectContract.projectData();
      const curatorFee = await projectContract.curatorFee();
      const fundingAmount = await projectContract.totalFunding();
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: projectAddress,
          index: projectIndex.toString(),
          name: hexToAscii(name).replace(/\0/g, ''),
          ipfsHash: hexToAscii(ipfsHash).replace(/\0/g, ''),
          cwUrl: hexToAscii(url).replace(/\0/g, ''),
          creator,
          beneficiary,
          acceptedToken,
          curatorFee: curatorFee.toString(),
          threshold: threshold.toString(),
          deadline: +deadline,
          fundingAmount: fundingAmount.toString(),
        },
      };
    }
    case EventKind.ProjectBacked: {
      const { sender, token, amount } = rawData.args as GetProjectArgType<
        'Back'
      >;

      return {
        blockNumber,
        excludeAddresses: [sender],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: rawData.address,
          sender,
          token,
          amount: amount.toString(),
        },
      };
    }
    case EventKind.ProjectCurated: {
      const { sender, token, amount } = rawData.args as GetProjectArgType<
        'Curate'
      >;
      return {
        blockNumber,
        excludeAddresses: [sender],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: rawData.address,
          sender,
          token,
          amount: amount.toString(),
        },
      };
    }
    case EventKind.ProjectSucceeded: {
      const { timestamp, amount } = rawData.args as GetProjectArgType<
        'Succeeded'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: rawData.address,
          timestamp: timestamp.toString(),
          amount: amount.toString(),
        },
      };
    }
    case EventKind.ProjectFailed: {
      // no arg data on failure
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: rawData.address,
        },
      };
    }
    case EventKind.ProjectWithdraw: {
      const {
        sender,
        token,
        amount,
        withdrawalType,
      } = rawData.args as GetProjectArgType<'Withdraw'>;
      return {
        blockNumber,
        excludeAddresses: [sender],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: rawData.address,
          sender,
          token,
          amount: amount.toString(),
          withdrawalType: hexToAscii(withdrawalType).replace(/\0/g, ''),
        },
      };
    }
    default: {
      throw new Error(`Unknown event kind: ${kind}`);
    }
  }

  return {
    blockNumber: null,
    network: SupportedNetwork.Commonwealth,
    data: null,
  };
}
