import type { CWEvent } from '../../../../interfaces';
import { SupportedNetwork } from '../../../../interfaces';
import type { TypedEventFilter } from '../../../../contractTypes/commons';
import type { ERC721 } from '../../../../contractTypes';
import type { RawEvent, IEventData, IErc721Contracts } from '../types';
import { EventKind } from '../types';

/**
 * This is an "enricher" function, whose goal is to augment the initial event data
 * received from the "system.events" query with additional useful information, as
 * described in the event's interface in our "types.ts" file.
 *
 * Once fetched, the function marshalls the event data and the additional information
 * into the interface, and returns a fully-formed event, ready for database storage.
 */

type GetEventArgs<T> = T extends TypedEventFilter<unknown, infer Y> ? Y : never;
type GetArgType<Name extends keyof ERC721['filters']> = GetEventArgs<
  ReturnType<ERC721['filters'][Name]>
>;

export async function Enrich(
  api: IErc721Contracts,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.Approval: {
      const { owner, approved, tokenId } =
        rawData.args as GetArgType<'Approval'>;
      const contractAddress = rawData.address;

      // should not notify sender or recipient
      const excludeAddresses = [owner.toString(), approved.toString()];

      return {
        blockNumber,
        excludeAddresses,
        network: SupportedNetwork.ERC721,
        data: {
          kind,
          owner,
          approved,
          tokenId: tokenId.toString(),
          contractAddress,
        },
      };
    }
    case EventKind.ApprovalForAll: {
      const { owner, operator, approved } =
        rawData.args as GetArgType<'ApprovalForAll'>;
      const contractAddress = rawData.address;

      // should not notify sender or recipient
      const excludeAddresses = [owner.toString(), operator.toString()];

      return {
        blockNumber,
        excludeAddresses,
        network: SupportedNetwork.ERC721,
        data: {
          kind,
          owner,
          operator,
          approved,
          contractAddress,
        },
      };
    }
    case EventKind.Transfer: {
      const { from, to, tokenId } = rawData.args as GetArgType<'Transfer'>;
      const contractAddress = rawData.address;

      // no need to explicitly filter transfers of zero tokens, as
      // this would just throw with ERC721.

      // should not notify sender or recipient
      const excludeAddresses = [from.toString(), to.toString()];

      return {
        blockNumber,
        excludeAddresses,
        network: SupportedNetwork.ERC721,
        data: {
          kind,
          from,
          to,
          tokenId: tokenId.toString(),
          contractAddress,
        },
      };
    }

    default: {
      throw new Error(`Unknown event kind: ${kind}`);
    }
  }
}
