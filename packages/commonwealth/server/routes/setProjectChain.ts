import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import { ChainNetwork } from '../../../common-common/src/types';
import type { ChainEntityMetaAttributes } from '../models/chain_entity_meta';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  OnlyAuthorCanSetChain: 'Creator of project not owned by caller',
  InvalidProjectId: 'Invalid project id',
};

type SetProjectChainReq = { chain_id: string; project_id: number };
type SetProjectChainResp = ChainEntityMetaAttributes;

const setProjectChain = async (
  models: DB,
  req: TypedRequestQuery<SetProjectChainReq>,
  res: TypedResponse<SetProjectChainResp>
) => {
  const { chain_id, project_id } = req.query;

  // TODO: if we're getting projects from multiple chains, this provides no
  //   way of distinguishing -- we need to ensure we only listen for projects on
  //   one chain ever to avoid overlapping projects meta objects.
  const project = await models.ChainEntityMeta.findOne({
    where: {
      chain: ChainNetwork.CommonProtocol,
      type_id: project_id,
    },
  });
  if (!project) {
    // TODO: we need to ensure we have the CE meta beforehand -- some sort of cache if we don't?
    throw new AppError(Errors.InvalidProjectId);
  }

  const author = await models.Address.findOne({
    where: {
      address: project.author,
      user_id: req.user.id,
    },
  });

  // site admin can set chain always
  if (!author && !req.user.isAdmin) {
    throw new AppError(Errors.OnlyAuthorCanSetChain);
  }
  project.project_chain = chain_id;
  await project.save();
  return success(res, project.toJSON());
};

export default setProjectChain;
