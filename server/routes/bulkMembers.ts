import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const { Op } = Sequelize;
const log = factory.getLogger(formatFilename(__filename));

const bulkMembers = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (error) return next(new Error(error));

  const options = {
    where: chain ? { chain_id: chain.id } : { offchain_community_id: community.id },
    include: [ models.Address ],
    order: [['created_at', 'DESC']],
  };
  if (req.query.limit) options['limit'] = req.query.limit;
  if (req.query.searchTerm?.length) {
    const subStr = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${req.query.searchTerm}%` } },
        {
          [Op.and]: [
            { name: { [Op.ne]: null } },
            { address: { [Op.iLike]: `%${req.query.searchTerm}%` } }
          ]
        }
      ]
    };
    options['where'] = Object.assign(options['where'], subStr);
  }

  console.log(options);

  const members = await models.Role.findAll(options);

  console.log(members[0]);

  return res.json({ status: 'Success', result: members.map((p) => p.toJSON()) });
};

export default bulkMembers;
