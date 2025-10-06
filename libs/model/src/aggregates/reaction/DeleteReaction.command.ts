import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authReaction } from '../../middleware';
import { verifyDeleteReactionSignature } from '../../middleware/canvas';
import { mustExist } from '../../middleware/guards';

export function DeleteReaction(): Command<typeof schemas.DeleteReaction> {
  return {
    ...schemas.DeleteReaction,
    auth: [authReaction(), verifyDeleteReactionSignature],
    body: async ({ payload }) => {
      const reaction = await models.Reaction.findOne({
        where: { id: payload.reaction_id },
      });
      mustExist('Reaction', reaction);
      await reaction.destroy();
      return { ...reaction!.toJSON() };
    },
  };
}
