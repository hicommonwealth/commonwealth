import Sequelize, {} from 'sequelize';
import { AppError, ServerError } from '../../util/errors';
import { GetThreadsReq, GetThreadsResp, OrderByOptions } from 'common-common/src/api/extApiTypes';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { formatPagination } from '../../util/queries';

const { Op } = Sequelize;

export const Errors = {
  NoArgs: "Must provide arguments",
  NoCommunityId: "Must provide a Community_id",
  AddressesOrAddressIds: "Cannot provide both addresses and address_ids",
};

const getThreads = async (
  models: DB,
  req: TypedRequestQuery<GetThreadsReq>,
  res: TypedResponse<GetThreadsResp>,
) => {
  if (!req.query) throw new AppError(Errors.NoArgs);

  const { community_id, topic_id, address_ids, no_body, include_comments, addresses } = req.query;
  if (!community_id) throw new AppError(Errors.NoCommunityId);
  if (addresses && address_ids) throw new AppError(Errors.AddressesOrAddressIds);

  const pagination = formatPagination(req.query);

  const where = { chain: community_id };

  const include = [];
  if (addresses) {
    include.push({
      model: models.Address,
      where: { address: { [Op.in]: addresses }},
      as: 'Address'
    });
  }

  let attributes;

  if (no_body) attributes = { exclude: ['body', 'plaintext', 'version_history'] };
  if (topic_id) where['topic_id'] = topic_id;
  if (address_ids) where['address_id'] = { [Op.in]: address_ids, };
  if (include_comments) include.push({ model: models.Comment, required: false, });

  const { rows: threads, count } = await models.Thread.findAndCountAll({
    logging: console.log,
    where,
    include,
    attributes,
    ...pagination
  });

  return success(res, { threads: threads.map((t) => t.toJSON()), count });
};

export default getThreads;
