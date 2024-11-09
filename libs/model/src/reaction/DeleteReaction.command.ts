import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authReaction } from '../middleware';
import { verifyDeleteReactionSignature } from '../middleware/canvas';

export function DeleteReaction(): Command<typeof schemas.DeleteReaction> {
  return {
    ...schemas.DeleteReaction,
    auth: [authReaction(), verifyDeleteReactionSignature],
    body: async ({ context }) => {
      const id = context!.reaction.id!;
      await models.Reaction.destroy({ where: { id } });
      return { reaction_id: id };
    },
  };
}
