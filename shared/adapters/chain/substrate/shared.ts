import { Codec } from '@polkadot/types/types';
import { Call, Hash, EventRecord } from '@polkadot/types/interfaces';
import { Enum, Vec, Tuple, GenericCall, GenericAccountId, U8aFixed } from '@polkadot/types';
import { ApiRx } from '@polkadot/api';
import { EventData } from '@polkadot/types/generic/Event';
import { Observable, from, never } from 'rxjs';
import { flatMap } from 'rxjs/operators';

/// Here we define serveral types relating to the substrate 'Call' type,
/// with the intent to create an easily serializable interface that also
/// preserves essential information.
export type IMethodArg = string | number | Uint8Array | IMethod | IMethodArgArray;

// recursive type definition allowing arrays as arguments
interface IMethodArgArray extends Array<IMethodArg> { }

export interface IMethod {
  call: string;
  section: string;
  callIndex: Uint8Array;
  args: IMethodArg[];
  hash: Hash;
}

function convertArg(a: Codec): IMethodArg {
  // TODO: Option types? Big numbers?
  if (a instanceof GenericCall) {
    return marshallMethod(a);
  } else if (a instanceof GenericAccountId || a instanceof String || a instanceof U8aFixed || a instanceof Enum) {
    return a.toString();
  } else if (a instanceof Vec || a instanceof Tuple) {
    return a.toArray().map(convertArg);
  } else {
    return a.toU8a();
  }
}

export function marshallMethod(m: Call): IMethod {
  return {
    args: m.args.map(convertArg),
    section: m.sectionName,
    call: m.methodName,
    callIndex: m.callIndex,
    hash: m.hash,
  };
}

export function waitEvent(api: ApiRx, filterFn: (e: EventData) => boolean): Observable<EventData> {
  return api.query.system.events().pipe(
    flatMap((events: Vec<EventRecord>) => {
      const toEmit = [];
      for (const { event, phase } of events) {
        if (filterFn(event.data)) {
          toEmit.push(event.data);
        }
      }
      return from(toEmit);
    }),
  );
}
