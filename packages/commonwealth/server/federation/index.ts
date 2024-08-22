import { startCanvasNode } from '@hicommonwealth/shared';

export {
  verifyComment,
  verifyDeleteComment,
  verifyDeleteReaction,
  verifyDeleteThread,
  verifyReaction,
  verifySession,
  verifyThread,
} from './verify';

export const canvas = await startCanvasNode();
