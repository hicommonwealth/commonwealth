/* eslint-disable @typescript-eslint/no-explicit-any */
import { CWEvent } from '../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';

/**
 * This is an "enricher" function, whose goal is to augment the initial event data
 * received from the "system.events" query with additional useful information, as
 * described in the event's interface in our "types.ts" file.
 *
 * Once fetched, the function marshalls the event data and the additional information
 * into the interface, and returns a fully-formed event, ready for database storage.
 */
export interface EnricherConfig {
  // if a balance transfer > (totalIssuance * balanceTransferThresholdPermill / 1_000_000)
  // then emit an event, otherwise do not emit for balance transfer.
  // Set to 0 or undefined to emit for all balance transfers.
  balanceTransferThreshold?: number;
}

export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent,
  config: EnricherConfig = {}
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.Approval: {
      const { owner, spender, value } = rawData.args as any;
      const contractAddress = rawData.address;
      return {
        blockNumber,
        data: {
          kind,
          owner,
          spender,
          value,
          contractAddress,
        },
      };
    }
    case EventKind.Transfer: {
      const { from, to, value } = rawData.args as any;
      const contractAddress = rawData.address;

      // only emit to everyone if transfer is 0 or above the configuration threshold
      const shouldEmitToAll = config.balanceTransferThreshold
        ? value.gte(config.balanceTransferThreshold)
        : false;
      const includeAddresses = shouldEmitToAll
        ? []
        : [from.toString(), to.toString()];

      return {
        // should not notify sender or recipient
        blockNumber,
        includeAddresses,
        data: {
          kind,
          from,
          to,
          value,
          contractAddress,
        },
      };
    }

    default: {
      throw new Error('unknown erc20 event kind!');
    }
  }
}
