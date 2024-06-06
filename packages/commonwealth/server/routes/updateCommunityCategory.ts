import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { CommunityCategoryType } from '@hicommonwealth/shared';
import { updateTags } from 'server/util/updateTags';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

const Errors = {
  InvalidCommunityId: 'Invalid Community Id',
  InvalidTagIds: 'Some tag ids are invalid',
};

type UpdateCommunityCategoryReq = {
  selected_tags: { [tag: string]: boolean };
  community_id: string;
  tag_ids?: number[];
  auth: string;
  jwt: string;
};

type UpdateCommunityCategoryRes = {
  community_id: string;
  tags: CommunityCategoryType[];
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
  if (!community) throw new AppError(Errors.InvalidCommunityId);

  const existingCategories = community.category
    ? (community.category as string[])
    : [];
  const updateCategories = Object.keys(req.body.selected_tags).filter((tag) => {
    return (
      req.body.selected_tags[tag] &&
      Object.keys(CommunityCategoryType).includes(tag)
    );
  });

  const { tag_ids } = req.body;
  // @ts-expect-error StrictNullChecks
  await updateTags(tag_ids, models, community.id, 'community_id');

  if (
    existingCategories.length !== updateCategories.length ||
    !updateCategories.every(
      (element, index) => element === existingCategories[index],
    )
  ) {
    community.category = updateCategories;
    await community.save();
  }
  return success(res, {
    community_id: req.body.community_id,
    tags: updateCategories as CommunityCategoryType[],
  });
};

export default updateCommunityCategory;
