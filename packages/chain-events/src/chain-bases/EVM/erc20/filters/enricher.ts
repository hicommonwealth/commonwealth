import BN from 'bn.js';

import type { CWEvent } from '../../../../interfaces';
import { SupportedNetwork } from '../../../../interfaces';
import type { TypedEventFilter } from '../../../../contractTypes/commons';
import type { ERC20 } from '../../../../contractTypes';
import type { RawEvent, IEventData, IErc20Contracts } from '../types';
import { EventKind } from '../types';

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
  balanceTransferThresholdPermill?: number;
}

type GetEventArgs<T> = T extends TypedEventFilter<unknown, infer Y> ? Y : never;
type GetArgType<Name extends keyof ERC20['filters']> = GetEventArgs<
  ReturnType<ERC20['filters'][Name]>
>;

export async function Enrich(
  api: IErc20Contracts,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent,
  config: EnricherConfig = {}
): Promise<CWEvent<IEventData>> {
  const { totalSupply } = api.tokens.find(
    ({ contract }) =>
      contract.address.toLowerCase() === rawData.address.toLowerCase()
  );
  switch (kind) {
    case EventKind.Approval: {
      const {
        owner,
        spender,
        value: valueBigNumber,
      } = rawData.args as GetArgType<'Approval'>;
      const contractAddress = rawData.address;
      const value = new BN(valueBigNumber.toString());

      // only emit to everyone if approval value is 0 or above the configuration threshold
      const shouldEmitToAll =
        !config.balanceTransferThresholdPermill ||
        value
          .muln(1_000_000)
          .divn(config.balanceTransferThresholdPermill)
          .gte(totalSupply);

      // skip this event if the approval value isn't above the threshold
      if (!shouldEmitToAll) return null;

      // should not notify sender or recipient
      const excludeAddresses = [owner.toString(), spender.toString()];

      return {
        blockNumber,
        excludeAddresses,
        network: SupportedNetwork.ERC20,
        data: {
          kind,
          owner,
          spender,
          value: value.toString(),
          contractAddress,
        },
      };
    }
    case EventKind.Transfer: {
      const {
        from,
        to,
        value: valueBigNumber,
      } = rawData.args as GetArgType<'Transfer'>;
      const contractAddress = rawData.address;
      const value = new BN(valueBigNumber.toString());

      // only emit to everyone if transfer is 0 or above the configuration threshold
      const shouldEmitToAll =
        !config.balanceTransferThresholdPermill ||
        value
          .muln(1_000_000)
          .divn(config.balanceTransferThresholdPermill)
          .gte(totalSupply);

      // skip this event if the transfer value isn't above the threshold
      if (!shouldEmitToAll) return null;

      // should not notify sender or recipient
      const excludeAddresses = [from.toString(), to.toString()];

      return {
        blockNumber,
        excludeAddresses,
        network: SupportedNetwork.ERC20,
        data: {
          kind,
          from,
          to,
          value: value.toString(),
          contractAddress,
        },
      };
    }

    default: {
      throw new Error(`Unknown event kind: ${kind}`);
    }
  }
}
