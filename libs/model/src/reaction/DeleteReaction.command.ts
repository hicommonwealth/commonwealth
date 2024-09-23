import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import { verifyDeleteReactionSignature } from '../middleware/canvas';
import { mustBeAuthorized, mustExist } from '../middleware/guards';

export function DeleteReaction(): Command<
  typeof schemas.DeleteReaction,
  AuthContext
> {
  return {
    ...schemas.DeleteReaction,
    auth: [isAuthorized({}), verifyDeleteReactionSignature],
    body: async ({ actor, payload, auth }) => {
      const { address } = mustBeAuthorized(actor, auth);
      const { reaction_id } = payload;

      const reaction = await models.Reaction.findOne({
        where: { id: reaction_id, address_id: address.id }, // only the author can delete a reaction
      });
      mustExist('Reaction', reaction);

      await reaction.destroy();

      return { reaction_id };
    },
  };
}
