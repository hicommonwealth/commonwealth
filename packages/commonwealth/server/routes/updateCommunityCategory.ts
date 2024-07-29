import { AppError } from '@hicommonwealth/core';
import type { DB, TagsInstance } from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { updateTags } from 'server/util/updateTags';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

const Errors = {
  InvalidCommunityId: 'Invalid Community Id',
  InvalidTagIds: 'Some tag ids are invalid',
};

type UpdateCommunityCategoryReq = {
  community_id: string;
  tag_ids: number[];
  auth: string;
  jwt: string;
};

type UpdateCommunityCategoryRes = {
  community_id: string;
  CommunityTags: TagsInstance[];
};

const updateCommunityCategory = async (
  models: DB,
  req: TypedRequestBody<UpdateCommunityCategoryReq>,
  res: TypedResponse<UpdateCommunityCategoryRes>,
) => {
  const community = await models.Community.findOne({
    where: {
      id: req.body.community_id,
    },
  });
  if (!community || !community.id) {
    throw new AppError(Errors.InvalidCommunityId);
  }

  const { tag_ids = [] } = req.body;

  await updateTags(tag_ids, models, community.id, 'community_id');

  const tags = await models.Tags.findAll({
    where: {
      id: {
        [Op.in]: tag_ids,
      },
    },
  });

  return success(res, {
    community_id: community.id,
    CommunityTags: tags,
  });
};

export default updateCommunityCategory;
