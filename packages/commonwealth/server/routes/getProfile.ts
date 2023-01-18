import { AppError } from 'common-common/src/errors';
import { factory, formatFilename } from 'common-common/src/logging';
import { Op } from 'sequelize';
import { DB } from '../models';
import { AddressAttributes } from '../models/address';
import { CommentAttributes } from '../models/comment';
import { ThreadAttributes } from '../models/thread';
import { success, TypedRequestQuery, TypedResponse } from '../types';


const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoChain: 'No base chain provided in query',
  NoAddress: 'No address provided in query',
  NoAddressFound: 'No address found',
};

type GetProfileReq = { chain: string, address: string };
type GetProfileResp = {
  account: AddressAttributes,
  threads: ThreadAttributes[],
  comments: CommentAttributes[],
}

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
    include: [models.OffchainProfile,],
  });
  if (!addressModel) throw new AppError(Errors.NoAddressFound);

  const comments = await models.Comment.findAll({
    where: {
      address_id: addressModel.id,
    },
  });

  const threads = await models.Thread.findAll({
    where: {
      [Op.or]: [{
        id: { [Op.in]: comments.map(c => c.root_id.split('_')[1]) },
        address_id: addressModel.id
      }]
    },
    include: [{ model: models.Address, as: 'Address' }],
  });

  return success(res, {
    account: addressModel.toJSON(),
    threads: threads.map((t) => t.toJSON()),
    comments: comments.map((c) => c.toJSON())
  });
};

export default getProfile;
