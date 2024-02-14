import { AppError, CommunityCategoryType } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

type UpdateChainCategoryReq = {
  selected_tags: { [tag: string]: boolean };
  community_id: string;
  auth: string;
  jwt: string;
};

type UpdateChainCategoryRes = {
  chain: string;
  tags: CommunityCategoryType[];
};

const updateChainCategory = async (
  models: DB,
  req: TypedRequestBody<UpdateChainCategoryReq>,
  res: TypedResponse<UpdateChainCategoryRes>,
) => {
  const chain = await models.Community.findOne({
    where: {
      id: req.body.community_id,
    },
  });
  if (!chain) throw new AppError('Invalid Chain Id');

  const existingCategories = chain.category ? (chain.category as string[]) : [];
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
    chain.category = updateCategories;
    await chain.save();
  }
  return success(res, {
    chain: req.body.community_id,
    tags: updateCategories as CommunityCategoryType[],
  });
};

export default updateChainCategory;
