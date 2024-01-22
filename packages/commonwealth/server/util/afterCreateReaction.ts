import { DB, ReactionInstance } from '@hicommonwealth/model';
import { Transaction } from 'sequelize';

export async function afterCreateReaction(
  model: DB,
  reaction: Partial<ReactionInstance>,
  transaction: Transaction | null | undefined,
) {
  if (reaction.calculated_voting_weight > 0) {
    if (reaction.thread_id) {
      const thread = await model.Thread.findByPk(reaction.thread_id);
      await thread.increment('reaction_weights_sum', {
        by: reaction.calculated_voting_weight,
        transaction,
      });
    }
    if (reaction.comment_id) {
      const comment = await model.Comment.findByPk(reaction.comment_id);
      await comment.increment('reaction_weights_sum', {
        by: reaction.calculated_voting_weight,
        transaction,
      });
    }
  }
}
