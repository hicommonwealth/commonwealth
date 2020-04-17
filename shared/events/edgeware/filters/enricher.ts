import { ApiPromise } from '@polkadot/api';
import { Event, ReferendumInfoTo239 } from '@polkadot/types/interfaces';
import { Option } from '@polkadot/types';
import { SubstrateEventKind, ISubstrateEventType } from '../types';
import { CWEvent } from '../../interfaces';

// TODO: better balance/BN handling than string
export default async function (
  api: ApiPromise,
  blockNumber: number,
  kind: SubstrateEventKind,
  event: Event,
): Promise<CWEvent> {
  const extractData = async (): Promise<{ data: ISubstrateEventType, affectedAddresses: string[] }> => {
    switch (kind) {
      case 'slash':
      case 'reward': {
        const [ validator, amount ] = event.data;
        return {
          affectedAddresses: [ validator.toString() ],
          data: {
            kind,
            validator: validator.toString(),
            amount: amount.toString(),
          }
        };
      }

      case 'democracy-proposed': {
        const [ proposalIndex, deposit ] = event.data;
        return {
          affectedAddresses: [],
          data: {
            kind,
            proposalIndex: +proposalIndex,
            deposit: deposit.toString(),
          }
        };
      }

      case 'democracy-started': {
        const [ referendumIndex ] = event.data;

        // query for edgeware only -- kusama has different type
        const info = await api.query.democracy.referendumInfoOf<Option<ReferendumInfoTo239>>(referendumIndex);
        return {
          affectedAddresses: [],
          data: {
            kind,
            referendumIndex: +referendumIndex,
            endBlock: info.isSome ? (+info.unwrap().end) : null,
          }
        };
      }

      case 'democracy-passed': {
        const [ referendumIndex ] = event.data;

        // dispatch queue -- if not present, it was already executed
        const dispatchQueue = await api.query.democracy.dispatchQueue();
        const dispatchInfo = dispatchQueue.find(([ block, hash, idx ]) => +idx === +referendumIndex);
        return {
          affectedAddresses: [],
          data: {
            kind,
            referendumIndex: +referendumIndex,
            dispatchBlock: dispatchInfo ? +dispatchInfo[0] : null,
          }
        };
      }

      case 'democracy-not-passed':
      case 'democracy-cancelled': {
        const [ referendumIndex ] = event.data;
        return {
          affectedAddresses: [],
          data: {
            kind,
            referendumIndex: +referendumIndex,
          }
        };
      }

      default:
        throw new Error('unknown event type');
    }
  };

  // construct CWEvent
  const eventData = await extractData();
  return { ...eventData, blockNumber };
}
