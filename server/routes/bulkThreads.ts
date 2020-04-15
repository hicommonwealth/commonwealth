import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';

const bulkThreads = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  // const userAddresses = req.user.getAddresses().filter((address) => !!address.verified);
  const userAddresses = req.user.getAddresses();
  const userAddressIds = Array.from(userAddresses.map((address) => address.id));
  console.dir(userAddresses);
  console.dir(userAddressIds);
  console.dir(community);
  const roles = await models.Role.findAll({
    where: {
      address_id: { [Op.in]: userAddressIds },
    }
  });

  console.dir(roles);

  const publicThreads = await models.OffchainThread.findAll({
    where:
      community
        ? {
          community: community.id,
          private: false,
        } : chain ? {
          chain: chain.id,
          private: false,
        } : {},
    include: [
      models.Address,
      {
        model: models.OffchainTag,
        as: 'tags',
        through: {
          model: models.TaggedThread,
          as: 'taggedThreads',
        },
      },
    ],
    order: [['created_at', 'DESC']],
  });

  const threads = publicThreads;

  // const threads = await models.OffchainThread.findAll({
  //   where: community ? { community: community.id }
  //     : chain ? { chain: chain.id } : {},
  //   include: [
  //     models.Address,
  //     {
  //       model: models.OffchainTag,
  //       as: 'tags',
  //       through: {
  //         model: models.TaggedThread,
  //         as: 'taggedThreads',
  //       },
  //     },
  //   ],
  //   order: [['created_at', 'DESC']],
  // });
  return res.json({ status: 'Success', result: threads.map((c) => c.toJSON()) });
};

export default bulkThreads;
