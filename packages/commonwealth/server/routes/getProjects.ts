import { WhereOptions } from 'sequelize/types';

import { AppError, ServerError } from 'common-common/src/errors';
import validateChain from '../util/validateChain';
import { DB } from '../models';
import { TypedRequestQuery, TypedResponse, success } from '../types';
import { ChainEntityMetaAttributes } from '../models/chain_entity_meta';
import { ChainNetwork } from '../../../common-common/src/types';

export const Errors = {
  InvalidAddress: 'Invalid address',
};

type GetProjectsReq = {
  chain_id?: string;
  project_id?: number;
};
type GetProjectsResp = ChainEntityMetaAttributes[];

const getProjects = async (
  models: DB,
  req: TypedRequestQuery<GetProjectsReq>,
  res: TypedResponse<GetProjectsResp>
) => {
  const { chain_id, project_id } = req.query as GetProjectsReq;
  const params: WhereOptions<ChainEntityMetaAttributes> = {
    chain: ChainNetwork.CommonProtocol,
  };
  if (chain_id) {
    try {
      const [, error] = await validateChain(models, { chain: chain_id });
      if (error) throw new AppError(error);
    } catch (err) {
      throw new AppError(err);
    }
    params.project_chain = chain_id;
  }
  if (project_id) {
    params.type_id = project_id;
  }

  // TODO: if we're getting projects from multiple chains, this provides no
  //   way of distinguishing -- we need to ensure we only listen for projects on
  //   one chain ever to avoid overlapping projects meta objects.
  try {
    const projects = await models.ChainEntityMeta.findAll({
      where: params,
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
