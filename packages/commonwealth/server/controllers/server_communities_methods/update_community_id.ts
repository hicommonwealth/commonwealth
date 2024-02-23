import { AppError } from '@hicommonwealth/core';
import {
  CommunityAttributes,
  CommunityInstance,
  ModelStatic,
} from '@hicommonwealth/model';
import { z } from 'zod';
import { ServerCommunitiesController } from '../server_communities_controller';

export const UpdateCommunityIdSchema = z.object({
  community_id: z.string(),
  new_community_id: z.string(),
  redirect: z.boolean().optional(),
});

export type UpdateCommunityIdOptions = z.infer<typeof UpdateCommunityIdSchema>;
export type UpdateCommunityIdResult = CommunityAttributes;

export async function __updateCommunityId(
  this: ServerCommunitiesController,
  { community_id, new_community_id, redirect }: UpdateCommunityIdOptions,
): Promise<UpdateCommunityIdResult> {
  const originalCommunity = await this.models.Community.findOne({
    where: {
      id: community_id,
    },
  });

  if (!originalCommunity) {
    throw new AppError('Community to rename not found!');
  }
  const { id, ...communityData } = originalCommunity.toJSON();

  let newCommunity: CommunityInstance;
  await this.models.sequelize.transaction(async (transaction) => {
    newCommunity = await this.models.Community.create(
      {
        id: new_community_id,
        ...communityData,
      },
      { transaction },
    );

    await this.models.Address.update(
      {
        community_id: new_community_id,
      },
      {
        where: {
          community_id,
        },
        transaction,
      },
    );
    await this.models.Ban.update(
      {
        community_id: new_community_id,
      },
      {
        where: {
          community_id,
        },
        transaction,
      },
    );

    // TODO: a txn like this could easily deadlock DB.
    //  A more thorough process where we disable the original community
    //  and gradually transfer data to the new community is likely required
    //  in the long-term. Alternative is to gradually duplicate the data
    //  and then delete the old data once redirect from old to new community
    // is enabled

    // TODO: execute query to find all columns that contain 'community_id'
    //  if any columns are missing updates in this route then return a warning
    //  this utility can be used to ensure we delete all references for community
    //  deletion as well ---> do this either via DB query or Sequelize model manipulation
    const models = [
      this.models.Address,
      this.models.Ban,
      this.models.Comment,
      this.models.CommunityBanner,
      this.models.Topic,
      this.models.Thread,
      this.models.Notification,
      this.models.Poll,
      this.models.Reaction,
      this.models.StarredCommunity,
      this.models.User,
      this.models.Vote,
      this.models.Webhook,
      this.models.CommunityContract,
      this.models.CommunitySnapshotSpaces,
      this.models.CommunityStake,
      this.models.DiscordBotConfig,
      this.models.Group,
      this.models.Subscription,
    ];
    for (const model of models) {
      await (model as ModelStatic<any>).update(
        {
          community_id: new_community_id,
        },
        {
          where: {
            community_id,
          },
          transaction,
        },
      );
    }

    await this.models.User.update(
      {
        selected_community_id: new_community_id,
      },
      {
        where: {
          selected_community_id: community_id,
        },
        transaction,
      },
    );

    await this.models.Vote.update(
      {
        author_community_id: new_community_id,
      },
      {
        where: {
          author_community_id: community_id,
        },
        transaction,
      },
    );

    await this.models.Comment.destroy({
      where: {
        id: community_id,
      },
      transaction,
    });
  });

  return newCommunity.toJSON();
}
