import type {
  AddressAttributes,
  CommentAttributes,
  DB,
  ProfileInstance,
  ProfileTagsAttributes,
  TagsAttributes,
  ThreadAttributes,
} from '@hicommonwealth/model';
import { Tag } from '@hicommonwealth/schemas';
import type { NextFunction } from 'express';
import { Op } from 'sequelize';
import z from 'zod';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  NoIdentifierProvided: 'No profile id provided in query',
  NoProfileFound: 'No profile found',
};

type GetNewProfileReq = {
  profileId?: string;
};
type GetNewProfileResp = {
  profile: ProfileInstance;
  addresses: AddressAttributes[];
  threads: ThreadAttributes[];
  comments: CommentAttributes[];
  commentThreads: ThreadAttributes[];
  isOwner: boolean;
  tags: z.infer<typeof Tag>[];
};

type ProfileWithTags = ProfileTagsAttributes & { Tag: TagsAttributes };

const getNewProfile = async (
  models: DB,
  req: TypedRequestQuery<GetNewProfileReq>,
  res: TypedResponse<GetNewProfileResp>,
  next: NextFunction,
) => {
  const { profileId } = req.query;
  let profile: ProfileInstance;

  if (profileId) {
    profile = await models.Profile.findOne({
      where: {
        id: profileId,
      },
    });
  } else {
    profile = await models.Profile.findOne({
      where: {
        user_id: req.user.id,
      },
    });
  }

  if (!profile) return next(new Error(Errors.NoProfileFound));

  const inActiveCommunities = (
    await models.Community.findAll({
      where: {
        active: false,
      },
      attributes: ['id'],
    })
  ).map((c) => c.id);

  const addresses = await profile.getAddresses({
    where: {
      community_id: {
        [Op.notIn]: inActiveCommunities,
      },
    },
  });

  const addressIds = [...new Set<number>(addresses.map((a) => a.id))];
  const threads = await models.Thread.findAll({
    where: {
      address_id: {
        [Op.in]: addressIds,
      },
      community_id: {
        [Op.notIn]: inActiveCommunities,
      },
    },
    include: [{ model: models.Address, as: 'Address' }],
  });

  const comments = await models.Comment.findAll({
    where: {
      address_id: {
        [Op.in]: addressIds,
      },
      community_id: {
        [Op.notIn]: inActiveCommunities,
      },
    },
    include: [{ model: models.Address, as: 'Address' }],
  });

  const commentThreadIds = [
    ...new Set<number>(comments.map((c) => c.thread_id, 10)),
  ];
  const commentThreads = await models.Thread.findAll({
    where: {
      id: {
        [Op.in]: commentThreadIds,
      },
      community_id: {
        [Op.notIn]: inActiveCommunities,
      },
    },
  });

  const profileTags = await models.ProfileTags.findAll({
    where: {
      profile_id: profileId || profile.id,
    },
    include: [
      {
        model: models.Tags,
      },
    ],
  });

  return success(res, {
    profile,
    addresses: addresses.map((a) => a.toJSON()),
    threads: threads.map((t) => t.toJSON()),
    comments: comments.map((c) => c.toJSON()),
    commentThreads: commentThreads.map((c) => c.toJSON()),
    isOwner: req.user?.id === profile.user_id,
    tags: profileTags
      .map((t) => t.toJSON())
      .map((t) => (t as ProfileWithTags).Tag),
  });
};

export default getNewProfile;
