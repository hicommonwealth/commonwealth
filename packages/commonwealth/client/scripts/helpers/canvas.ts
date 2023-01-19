import createHash from 'create-hash';
import {
  Action,
  Session,
  serializeActionPayload,
  serializeSessionPayload,
} from '@canvas-js/interfaces';

// TODO: should we hash the payload, or payload and signature?

export function actionToHash(action: Action): Buffer {
  const data = serializeActionPayload(action.payload);
  const hash = createHash('sha256').update(data).digest();
  return hash;
}

export function sessionToHash(session: Session): Buffer {
  const data = serializeSessionPayload(session.payload);
  const hash = createHash('sha256').update(data).digest();
  return hash;
}
