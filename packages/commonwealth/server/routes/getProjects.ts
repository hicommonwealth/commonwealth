import { WhereOptions } from 'sequelize/types';
import Web3 from 'web3';

import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';
import { ProjectAttributes } from '../models/project';
import { TypedRequestQuery, TypedResponse, success } from '../types';

export const Errors = {
  InvalidAddress: 'Invalid address',
};

type GetProjectsReq = {
  creator_address?: string;
  chain_id?: string;
  project_id?: number;
};
type GetProjectsResp = ProjectAttributes[];

const getProjects = async (
  models: DB,
  req: TypedRequestQuery<GetProjectsReq>,
  res: TypedResponse<GetProjectsResp>
) => {
  console.log(req.query);
  const { creator_address, chain_id, project_id } = req.query as GetProjectsReq;
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
  if (creator_address) {
    if (!Web3.utils.isAddress(creator_address)) {
      throw new AppError(Errors.InvalidAddress);
    }
    params.creator = creator_address;
  }
  if (project_id) {
    params.id = project_id;
  }

  try {
    const projects = await models.Project.findAll({
      where: params,
      include: {
        model: models.ChainEntity,
        include: [
          {
            model: models.ChainEvent,
            order: [[models.ChainEvent, 'id', 'asc']],
            include: [models.ChainEventType],
          },
        ],
      },
    });
    console.log(projects[0]);
    return success(
      res,
      projects.map((p) => p.toJSON())
    );
  } catch (err) {
    throw new ServerError(err);
  }
};

export default getProjects;
