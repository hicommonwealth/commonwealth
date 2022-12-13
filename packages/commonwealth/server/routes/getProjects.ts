import { WhereOptions } from 'sequelize/types';

import { AppError, ServerError } from 'common-common/src/errors';
import validateChain from '../util/validateChain';
import { DB } from '../models';
import { ProjectAttributes } from '../models/project';
import { TypedRequestQuery, TypedResponse, success } from '../types';

export const Errors = {
  InvalidAddress: 'Invalid address',
};

type GetProjectsReq = {
  chain_id?: string;
  project_id?: number;
};
type GetProjectsResp = ProjectAttributes[];

const getProjects = async (
  models: DB,
  req: TypedRequestQuery<GetProjectsReq>,
  res: TypedResponse<GetProjectsResp>
) => {
  const { chain_id, project_id } = req.query as GetProjectsReq;
  const params: WhereOptions<ProjectAttributes> = {};
  if (chain_id) {
    try {
      const [, error] = await validateChain(models, { chain: chain_id });
      if (error) throw new AppError(error);
    } catch (err) {
      throw new AppError(err);
    }
    params.chain_id = chain_id;
  }
  if (project_id) {
    params.id = project_id;
  }

  try {
    const projects = await models.Project.findAll({
      where: params,
      include: {
        model: models.ChainEntityMeta,
        required: true,
      },
    });

    return success(
      res,
      projects.map((p) => p.toJSON())
    );
  } catch (err) {
    throw new ServerError(err);
  }
};

export default getProjects;
