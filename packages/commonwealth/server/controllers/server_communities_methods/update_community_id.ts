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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // TODO: a txn like this could cause deadlocks.
    //  A more thorough process where we disable the original community
    //  and gradually transfer data to the new community is likely required
    //  in the long-term. Alternative is to gradually duplicate the data
    //  and then delete the old data once redirect from old to new community
    //  is enabled
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

    await this.models.Community.update(
      {
        redirect: redirect ? new_community_id : '',
      },
      {
        where: {
          id: community_id,
        },
        transaction,
      },
    );
  });

  return newCommunity.toJSON();
}
