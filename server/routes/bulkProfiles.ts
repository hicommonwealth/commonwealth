import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));
const bulkProfiles = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  let communities;
  let addrs;
  if (req.body['communities[]'] && typeof req.body['communities[]'] === 'string') {
    communities = [ req.body['communities[]'] ];
  } else if (req.body['communities[]']) {
    communities = req.body['communities[]'];
  } else {
    return next(new Error('Must specify chain'));
  }

  if (req.body['addresses[]'] && typeof req.body['addresses[]'] === 'string') {
    addrs = [ req.body['addresses[]'] ];
  } else if (req.body['addresses[]']) {
    addrs = req.body['addresses[]'];
  } else {
    return next(new Error('Must specify addresses'));
  }

  if (communities.length !== addrs.length) {
    return next(new Error('Must specify exactly one address for each one chain'));
  }

  let addrObjs;
  // if all profiles are on the same chain, make a fast query, otherwise, make multiple queries
  if (_.uniq(communities).length === 1) {
    addrObjs = await models.Address.findAll({
      where: {
        community_id: communities[0],
        address: addrs,
      }
    });
  } else {
    let query;
    addrObjs = [];
    for (const community in communities) {
      if (communities[community]) {
        query = await models.Address.findAll({
          where: {
            community_id: communities[community],
            address: addrs,
          }
        });
        addrObjs.push(query);
      }
    }
    addrObjs = addrObjs.flat();
  }

  const profiles = await models.OffchainProfile.findAll({
    where: { address_id: addrObjs.map((obj) => obj.id) },
    include: [ models.Address ]
  });

  return res.json({
    status: 'Success',
    result: profiles.map((profile) => profile.toJSON())
  });
};

export default bulkProfiles;
