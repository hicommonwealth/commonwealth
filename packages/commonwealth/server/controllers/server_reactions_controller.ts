import { DB } from '@hicommonwealth/model';
import {
  DeleteReactionOptions,
  DeleteReactionResult,
  __deleteReaction,
} from './server_reactions_methods/delete_reaction';

/**
 * Implements methods related to reactions
 *
 */
export class ServerReactionsController {
  constructor(public models: DB) {}

  async deleteReaction(
    options: DeleteReactionOptions,
  ): Promise<DeleteReactionResult> {
    return __deleteReaction.call(this, options);
  }
}
