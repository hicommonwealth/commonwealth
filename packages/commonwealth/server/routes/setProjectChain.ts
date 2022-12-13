import { AppError } from 'common-common/src/errors';
import validateChain from '../util/validateChain';
import { DB } from '../models';
import { TypedRequestQuery, TypedResponse, success } from '../types';
import { ChainEntityMetaAttributes } from '../models/chain_entity_meta';
import { ChainNetwork } from '../../../common-common/src/types';

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
  try {
    const [, error] = await validateChain(models, { chain: chain_id });
    if (error) throw new AppError(error);
  } catch (err) {
    throw new AppError(err);
  }

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
