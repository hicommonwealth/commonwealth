import { AppError } from 'common-common/src/errors';
import { Op } from 'sequelize';
import type { DB } from '../models';
import type { AddressAttributes } from '../models/address';
import type { CommentAttributes } from '../models/comment';
import type { ThreadAttributes } from '../models/thread';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  NoChain: 'No base chain provided in query',
  NoAddress: 'No address provided in query',
  NoAddressFound: 'No address found',
};

type GetProfileReq = { chain: string; address: string };
type GetProfileResp = {
  account: AddressAttributes;
  threads: ThreadAttributes[];
  comments: CommentAttributes[];
};

const getProfile = async (
  models: DB,
  req: TypedRequestQuery<GetProfileReq>,
  res: TypedResponse<GetProfileResp>
) => {
  const { chain, address } = req.query;
  if (!chain) throw new AppError(Errors.NoChain);
  if (!address) throw new AppError(Errors.NoAddress);

  const addressModel = await models.Address.findOne({
    where: {
      address,
      chain,
    },
    include: [models.OffchainProfile],
  });
  if (!addressModel) throw new AppError(Errors.NoAddressFound);

  const comments = await models.Comment.findAll({
    where: {
      address_id: addressModel.id,
    },
  });

  const commentThreadIds = comments
    .map((c) => c.root_id.split('_')[1])
    .filter((id) => !!parseInt(id, 10)); // remove proposals from id list

  const threads = await models.Thread.findAll({
    where: {
      [Op.or]: [
        { id: { [Op.in]: commentThreadIds } },
        { address_id: addressModel.id },
      ],
    },
    include: [{ model: models.Address, as: 'Address' }],
  });

  return success(res, {
    account: addressModel.toJSON(),
    threads: threads.map((t) => t.toJSON()),
    comments: comments.map((c) => c.toJSON()),
  });
};

export default getProfile;
