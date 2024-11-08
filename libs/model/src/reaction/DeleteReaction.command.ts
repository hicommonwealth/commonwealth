import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authReaction } from '../middleware';
import { verifyDeleteReactionSignature } from '../middleware/canvas';
import { mustBeAuthorized, mustExist } from '../middleware/guards';

export function DeleteReaction(): Command<typeof schemas.DeleteReaction> {
  return {
    ...schemas.DeleteReaction,
    auth: [authReaction(), verifyDeleteReactionSignature],
    body: async ({ actor, payload, context }) => {
      const { address } = mustBeAuthorized(actor, context);
      const { reaction_id } = payload;

      // TODO: this can be replaced by the loaded reaction in auth context
      const reaction = await models.Reaction.findOne({
        where: { id: reaction_id, address_id: address.id }, // only the author can delete a reaction
      });
      mustExist('Reaction', reaction);

      await reaction.destroy();

      return { reaction_id };
    },
  };
}
