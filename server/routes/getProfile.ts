import { AddressAttributes } from '../models/address';
import { OffchainCommentAttributes } from '../models/offchain_comment';
import { OffchainThreadAttributes } from '../models/offchain_thread';
import { success, TypedRequestQuery, TypedResponse } from '../types';
import { AppError } from '../util/errors';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
import { DB } from '../database';

export const Errors = {
  NoChain: 'No base chain provided in query',
  NoAddress: 'No address provided in query',
  NoAddressFound: 'No address found',
};

type GetProfileReq = { chain: string, address: string };
type GetProfileResp = {
  account: AddressAttributes,
  threads: OffchainThreadAttributes[],
  comments: OffchainCommentAttributes[],
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
    include: [ models.OffchainProfile, ],
  });
  if (!addressModel) throw new AppError(Errors.NoAddressFound);

  const threads = await models.OffchainThread.findAll({
    where: {
      address_id: addressModel.id,
    },
    include: [ { model: models.Address, as: 'Address' } ],
  });

  const comments = await models.OffchainComment.findAll({
    where: {
      address_id: addressModel.id,
    },
  });

  return success(res, {
    account: addressModel.toJSON(),
    threads: threads.map((t) => t.toJSON()),
    comments: comments.map((c) => c.toJSON())
  })
};

export default getProfile;
