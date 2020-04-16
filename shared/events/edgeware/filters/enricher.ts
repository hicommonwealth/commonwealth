import { ApiPromise } from '@polkadot/api';
import { Event, ReferendumInfoTo239 } from '@polkadot/types/interfaces';
import { Option } from '@polkadot/types';
import { SubstrateEventType } from '../types';

// TODO: better balance/BN handling than string
export async function enrichEvent(api: ApiPromise, type: SubstrateEventType, event: Event): Promise<any> {
  switch (type) {
    case SubstrateEventType.Slash:
    case SubstrateEventType.Reward: {
      const [ validator, amount ] = event.data;
      return {
        validator: validator.toString(),
        amount: amount.toString(),
      };
    }

    case SubstrateEventType.DemocracyProposed: {
      const [ proposalIndex, deposit ] = event.data;
      return {
        proposalIndex: +proposalIndex,
        deposit: deposit.toString(),
      };
    }

    case SubstrateEventType.DemocracyStarted: {
      const [ referendumIndex ] = event.data;

      // query for edgeware only -- kusama has different type
      const info = await api.query.democracy.referendumInfoOf<Option<ReferendumInfoTo239>>(referendumIndex);
      return {
        referendumIndex: +referendumIndex,
        endBlock: info.isSome ? (+info.unwrap().end) : null,
      };
    }

    case SubstrateEventType.DemocracyPassed: {
      const [ referendumIndex ] = event.data;

      // dispatch queue -- if not present, it was already executed
      const dispatchQueue = await api.query.democracy.dispatchQueue();
      const dispatchInfo = dispatchQueue.find(([ block, hash, idx ]) => +idx === +referendumIndex);
      return {
        referendumIndex: +referendumIndex,
        dispatchBlock: dispatchInfo ? +dispatchInfo[0] : null,
      };
    }

    case SubstrateEventType.DemocracyNotPassed:
    case SubstrateEventType.DemocracyCancelled: {
      const [ referendumIndex ] = event.data;
      return {
        referendumIndex: +referendumIndex,
      };
    }

    case SubstrateEventType.Unknown:
    default:
      throw new Error('unknown event type');
  }
}
