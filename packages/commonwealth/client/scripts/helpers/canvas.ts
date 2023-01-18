import createHash from 'create-hash';
import { Action, Session } from '@canvas-js/interfaces';
import * as cbor from 'microcbor';

export function actionToHash(action: Action): Buffer {
  const data = JSON.stringify(action);
  const hash = createHash('sha256').update(data).digest();
  return hash;
}

export function sessionToHash(session: Session): Buffer {
  const data = JSON.stringify(session);
  const hash = createHash('sha256').update(data).digest();
  return hash;
}
