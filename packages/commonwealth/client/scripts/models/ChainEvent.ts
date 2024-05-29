import type { SupportedNetwork } from '@hicommonwealth/shared';
import _ from 'underscore';
import type { IChainEventData } from '../../../shared/chain/types/types';

class ChainEvent {
  public readonly id?: number;
  public readonly blockNumber?: number;
  public readonly data: IChainEventData;
  public readonly chain: string;
  public readonly network: SupportedNetwork;

  public eq(e: ChainEvent) {
    return e.data.kind === this.data.kind && _.isEqual(this.data, e.data);
  }

  constructor(data, id?, chain?, network?, blockNumber?) {
    this.id = id;
    this.blockNumber = blockNumber;
    this.data = data;
    this.chain = chain;
    this.network = network;
  }

  public static fromJSON(json) {
    return new ChainEvent(
      json.data || json.event_data,
      json.id,
      json.community_id,
      json.network,
      json.blockNumber || json.block_number,
    );
  }
}

export default ChainEvent;
