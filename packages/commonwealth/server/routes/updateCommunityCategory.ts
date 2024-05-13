import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { CommunityCategoryType } from '@hicommonwealth/shared';
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
  if (tag_ids) {
    // verify all tag ids exist
    if (tag_ids.length > 0) {
      const tagCount = await models.Tags.count({
        where: {
          id: tag_ids,
        },
      });

      const allTagsFound = tagCount === tag_ids.length;

      if (!allTagsFound) {
        throw new AppError(Errors.InvalidTagIds);
      }
    }

    // remove all existing tags
    await models.CommunityTags.destroy({
      where: {
        community_id: community.id,
      },
    });

    // create new tags
    if (tag_ids.length > 0) {
      const [status, newRows] = await models.CommunityTags.bulkCreate(
        tag_ids.map((id) => ({
          tag_id: id,
          community_id: community.id,
        })),
      );

      if (!status || !newRows) {
        throw new AppError('Failed');
      }
    }
  }

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
