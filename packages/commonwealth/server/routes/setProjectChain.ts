import { AppError } from 'common-common/src/errors';
import validateChain from '../util/validateChain';
import { DB } from '../models';
import { ProjectAttributes } from '../models/project';
import { TypedRequestQuery, TypedResponse, success } from '../types';

export const Errors = {
  OnlyAuthorCanSetChain: 'Creator of project not owned by caller',
  InvalidProjectId: 'Invalid project id',
};

type SetProjectChainReq = { chain_id: string; project_id: number };
type SetProjectChainResp = ProjectAttributes;

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

  const project = await models.Project.findOne({
    where: { id: project_id },
    include: {
      model: models.ChainEntityMeta,
      required: true,
    }
  });
  if (!project) {
    throw new AppError(Errors.InvalidProjectId);
  }

  // TODO: ChainEntityMeta.author is never set???
  const author = await models.Address.findOne({
    where: {
      address: project.ChainEntityMeta.author,
      user_id: req.user.id,
    },
  });

  // site admin can set chain always
  if (!author && !req.user.isAdmin) {
    throw new AppError(Errors.OnlyAuthorCanSetChain);
  }
  project.chain_id = chain_id;
  await project.save();
  return success(res, project.toJSON());
};

export default setProjectChain;
