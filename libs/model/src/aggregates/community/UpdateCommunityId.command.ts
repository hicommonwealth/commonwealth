/*
import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import {
  UpdateCommunityIdOptions,
  UpdateCommunityIdResult,
  UpdateCommunityIdSchema,
} from '../../controllers/server_communities_methods/update_community_id';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { formatErrorPretty } from '../../util/errorFormat';

type UpdateCommunityIdParams = UpdateCommunityIdOptions;
type UpdateCommunityIdResponse = UpdateCommunityIdResult;

export const updateCommunityIdHandler = async (
  models: DB,
  controllers: ServerControllers,
  req: TypedRequestBody<UpdateCommunityIdParams>,
  res: TypedResponse<UpdateCommunityIdResponse>,
) => {
  // @ts-expect-error StrictNullChecks
  if (!req.user.isAdmin) {
    throw new AppError('Must be a super admin to update community id');
  }

  const validationResult = UpdateCommunityIdSchema.safeParse(req.body);

  if (validationResult.success === false) {
    throw new AppError(formatErrorPretty(validationResult));
  }

  const result = await controllers.communities.updateCommunityId(
    validationResult.data,
  );

  return success(res, result);
};

 */

/*
import { AppError } from '@hicommonwealth/core';
import {
  CommunityAttributes,
  CommunityInstance,
  ModelInstance,
} from '@hicommonwealth/model';
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
        network:
          communityData.network === id
            ? new_community_id
            : communityData.network,
      },
      { transaction },
    );

    // TODO: a txn like this could cause deadlocks.
    //  A more thorough process where we disable the original community
    //  and gradually transfer data to the new community is likely required
    //  in the long-term. Alternative is to gradually duplicate the data
    //  and then delete the old data once redirect from old to new community
    //  is enabled
    const models: ModelStatic<ModelInstance<{ community_id: string }>>[] = [
      this.models.Address,
      this.models.Topic,
      this.models.Thread,
      this.models.Poll,
      this.models.StarredCommunity,
      this.models.Vote,
      this.models.Webhook,
      this.models.CommunityStake,
      this.models.DiscordBotConfig,
      this.models.Group,
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

 */
