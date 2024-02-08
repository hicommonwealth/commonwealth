import { AppError, CommunityCategoryType } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

type UpdateCommunityCategoryReq = {
  selected_tags: { [tag: string]: boolean };
  community_id: string;
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
  if (!community) throw new AppError('Invalid Community Id');

  const existingCategories = community.category
    ? (community.category as string[])
    : [];
  const updateCategories = Object.keys(req.body.selected_tags).filter((tag) => {
    return (
      req.body.selected_tags[tag] &&
      Object.keys(CommunityCategoryType).includes(tag)
    );
  });

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
