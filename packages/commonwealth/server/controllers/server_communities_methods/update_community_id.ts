import { AppError } from '@hicommonwealth/core';
import {
  CommunityAttributes,
  CommunityInstance,
  ModelInstance,
} from '@hicommonwealth/model';
import { ChainNetwork } from '@hicommonwealth/shared';
import { type ModelStatic } from 'sequelize';
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

  const existingRedirect = await this.models.Community.findOne({
    where: {
      redirect: community_id,
    },
  });
  if (existingRedirect) {
    throw new AppError('Community redirect already exists');
  }

  const existingNewCommunity = await this.models.Community.findOne({
    where: {
      id: new_community_id,
    },
  });
  if (existingNewCommunity) {
    throw new AppError('Community already exists');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...communityData } = originalCommunity.toJSON();

  let newCommunity: CommunityInstance;
  await this.models.sequelize.transaction(async (transaction) => {
    newCommunity = await this.models.Community.create(
      {
        id: new_community_id,
        ...communityData,
        redirect: community_id,
        network: (communityData.network === id
          ? new_community_id
          : communityData.network) as ChainNetwork,
      },
      { transaction },
    );

    // TODO: a txn like this could cause deadlocks.
    //  A more thorough process where we disable the original community
    //  and gradually transfer data to the new community is likely required
    //  in the long-term. Alternative is to gradually duplicate the data
    //  and then delete the old data once redirect from old to new community
    //  is enabled
    const models: ModelStatic<ModelInstance<{ community_id?: string }>>[] = [
      // @ts-expect-error StrictNullChecks
      this.models.Address,
      // @ts-expect-error StrictNullChecks
      this.models.Ban,
      // @ts-expect-error StrictNullChecks
      this.models.Comment,
      // @ts-expect-error StrictNullChecks
      this.models.CommunityBanner,
      // @ts-expect-error StrictNullChecks
      this.models.Topic,
      // @ts-expect-error StrictNullChecks
      this.models.Thread,
      this.models.Notification,
      // @ts-expect-error StrictNullChecks
      this.models.Poll,
      // @ts-expect-error StrictNullChecks
      this.models.Reaction,
      // @ts-expect-error StrictNullChecks
      this.models.StarredCommunity,
      // @ts-expect-error StrictNullChecks
      this.models.Vote,
      // @ts-expect-error StrictNullChecks
      this.models.Webhook,
      // @ts-expect-error StrictNullChecks
      this.models.CommunityContract,
      // @ts-expect-error StrictNullChecks
      this.models.CommunityStake,
      // @ts-expect-error StrictNullChecks
      this.models.DiscordBotConfig,
      // @ts-expect-error StrictNullChecks
      this.models.Group,
      this.models.Subscription,
    ];
    for (const model of models) {
      await model.update(
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

    await this.models.Template.update(
      {
        created_for_community: new_community_id,
      },
      {
        where: {
          created_for_community: community_id,
        },
        transaction,
      },
    );

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

    await this.models.Community.destroy({
      where: {
        id: community_id,
      },
      transaction,
    });
  });

  // @ts-expect-error StrictNullChecks
  return newCommunity.toJSON();
}
