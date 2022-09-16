import { factory, formatFilename } from 'common-common/src/logging';
import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';
import { TypedResponse, success, TypedRequestBody } from '../types';
import { ChainInstance } from '../models/chain';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { AddressInstance } from '../models/address';
import { ChainNetwork } from '../../../common-common/src/types';
import { Op } from 'sequelize/types';
import { chain } from 'lodash';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  InvalidChain: 'Invalid chain',
};

type ForumMetricsReq = { chain_id: string, };
type ForumMetricsResp = string;

const getForumMetrics = async (
  models: DB,
  req: TypedRequestBody<ForumMetricsReq>,
  res: TypedResponse<ForumMetricsResp>
) => {
  if (!req.body.chain_id) {
    throw new AppError(Errors.InvalidChain)
  }

  const { chain_id } = req.body;

  const roles = await models.Role.findAll({
    where: {
      chain_id,
    }
  });

  const addressIds = roles.map((r) => r.address_id);

  const addresses = await models.Address.findAll({
    where: {
      id: {
        [Op.in]: addressIds,
      },
    },
  });

  const result = {};

  await Promise.all(addresses.map((addr) => {
    // get Threads,
    const threadsQuery = `
    SELECT 
      thr.id as thread_id, thr.chain, addr.address as address, 
      thr.stage, thr.topic_id, top.name, COUNT(r.id) as reactions 
    FROM "Threads" thr 
    LEFT JOIN "Topics" top 
      ON thr.topic_id = top.id
    LEFT JOIN "Addresses" addr
      ON thr.address_id = addr.id
    LEFT JOIN "Reactions" r
      ON r.thread_id = thr.id
    WHERE thr.chain = '${chain_id}'
      AND addr.id = '${addr.id}'
    GROUP BY r.thread_id, thr.id, addr.address, thr.stage, thr.topic_id, top.name; 
    `
    const threads = models.sequelize.query(threadsQuery)

    // get Comments
    const comments = models.Comment.findAll({
      where: {
        address_id: addr.id,
        chain: chain_id,
      },
      include: 
    })

    result[addr.address] = {threads, comments}
  }))



  return success(res, balance.toString());
};

export default getForumMetrics;
